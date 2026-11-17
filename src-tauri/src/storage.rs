use std::{fs, io::{Read, Write}, path::{Path, PathBuf}};

pub const FILE_LIMIT: u64 = 5_000_000;
pub const BACKUP_LIMIT: u64 = 50_000_000;
pub fn transfer_limit(kind: &str) -> Result<u64, String> {
    match kind { "lab" => Ok(FILE_LIMIT), "backup" => Ok(BACKUP_LIMIT), _ => Err("invalid-file-type".into()) }
}
const KEYS: [&str; 23] = [
    "glass-notes.preferences", "glass-notes.favorites.v1", "glass-notes.pantry.v1",
    "glass-notes.owned-bottles.v1", "glass-notes.lab.v1",
    "glass-notes.private-recipes.v1", "glass-notes.backup-references.v1", "glass-notes.storage-generation.v1", "glass-notes.recovery.v1",
    "glass-notes.recovery.before.0", "glass-notes.recovery.before.1", "glass-notes.recovery.before.2", "glass-notes.recovery.before.3",
    "glass-notes.recovery.before.4", "glass-notes.recovery.before.5", "glass-notes.recovery.before.6", "glass-notes.recovery.before.7",
    "glass-notes.making.v1", "glass-notes.recovery.before.8",
    "glass-notes.taste.v1", "glass-notes.recovery.before.9",
    "glass-notes.shopping.v1", "glass-notes.recovery.before.10",
];

pub fn entry_path(root: &Path, key: &str) -> Result<PathBuf, String> {
    if !KEYS.contains(&key) { return Err("unknown-storage-key".into()); }
    Ok(root.join(format!("{key}.json")))
}

pub fn validate_json(value: &str) -> Result<(), String> {
    validate_json_bounded(value, FILE_LIMIT)
}

pub fn validate_json_bounded(value: &str, limit: u64) -> Result<(), String> {
    if value.len() as u64 > limit { return Err("file-too-large".into()); }
    serde_json::from_str::<serde_json::Value>(value).map_err(|_| "invalid-json".to_string())?;
    Ok(())
}

pub fn read_bounded(path: &Path) -> Result<String, String> {
    read_bounded_with_limit(path, FILE_LIMIT)
}

pub fn read_bounded_with_limit(path: &Path, limit: u64) -> Result<String, String> {
    let file = fs::File::open(path).map_err(|_| "file-read-failed".to_string())?;
    if file.metadata().map_err(|_| "file-read-failed")?.len() > limit {
        return Err("file-too-large".into());
    }
    let mut value = String::new();
    file.take(limit + 1).read_to_string(&mut value).map_err(|_| "file-read-failed".to_string())?;
    if value.len() as u64 > limit { return Err("file-too-large".into()); }
    Ok(value)
}

pub fn read_entry(root: &Path, key: &str) -> Result<Option<String>, String> {
    let path = entry_path(root, key)?;
    match fs::metadata(&path) {
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(_) => Err("storage-read-failed".into()),
        Ok(_) => {
            let value = read_bounded(&path)?;
            validate_json(&value)?;
            Ok(Some(value))
        }
    }
}

pub fn write_atomic(path: &Path, value: &str) -> Result<(), String> {
    write_atomic_with_limit(path, value, FILE_LIMIT)
}

pub fn write_atomic_with_limit(path: &Path, value: &str, limit: u64) -> Result<(), String> {
    if value.len() as u64 > limit { return Err("file-too-large".into()); }
    let parent = path.parent().ok_or("invalid-file-path")?;
    let mut temporary = tempfile::NamedTempFile::new_in(parent).map_err(|_| "file-write-failed")?;
    temporary.write_all(value.as_bytes()).map_err(|_| "file-write-failed")?;
    temporary.as_file().sync_all().map_err(|_| "file-write-failed")?;
    temporary.persist(path).map_err(|_| "file-replace-failed")?;
    Ok(())
}

pub fn write_entry(root: &Path, key: &str, value: &str) -> Result<(), String> {
    let path = entry_path(root, key)?;
    validate_json(value)?;
    fs::create_dir_all(root).map_err(|_| "storage-directory-failed")?;
    write_atomic(&path, value)
}

pub fn remove_entry(root: &Path, key: &str) -> Result<(), String> {
    let path = entry_path(root, key)?;
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(_) => Err("storage-remove-failed".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn full_backup_transfers_exceed_single_store_limit_without_raising_it() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("backup.json");
        let value = format!("{{\"notes\":\"{}\"}}", "x".repeat(FILE_LIMIT as usize));
        assert!(write_entry(dir.path(), KEYS[4], &value).is_err());
        assert!(validate_json(&value).is_err());
        let limit = transfer_limit("backup").unwrap();
        validate_json_bounded(&value, limit).unwrap();
        write_atomic_with_limit(&path, &value, limit).unwrap();
        assert_eq!(read_bounded_with_limit(&path, limit).unwrap(), value);
        assert!(read_bounded(&path).is_err());
        assert!(transfer_limit("anything").is_err());
        assert_eq!(transfer_limit("lab").unwrap(), FILE_LIMIT);
    }
    #[test]
    fn writes_and_replacement_preserve_exact_values() {
        let dir = tempfile::tempdir().unwrap();
        let value = "{\"notes\":\"青柠\",\"amount\":\"1.234500\"}";
        write_entry(dir.path(), KEYS[4], value).unwrap();
        assert_eq!(read_entry(dir.path(), KEYS[4]).unwrap(), Some(value.into()));
        write_entry(dir.path(), KEYS[4], "{\"notes\":\"next version\"}").unwrap();
        assert_eq!(read_entry(dir.path(), KEYS[4]).unwrap().unwrap(), "{\"notes\":\"next version\"}");
    }
    #[test]
    fn invalid_writes_and_paths_preserve_existing_data() {
        let dir = tempfile::tempdir().unwrap();
        write_entry(dir.path(), KEYS[4], "{\"existing\":true}").unwrap();
        assert!(write_entry(dir.path(), KEYS[4], "broken").is_err());
        assert!(write_entry(dir.path(), "../outside", "{}").is_err());
        assert!(write_entry(dir.path(), KEYS[4], &"x".repeat(FILE_LIMIT as usize + 1)).is_err());
        assert_eq!(read_entry(dir.path(), KEYS[4]).unwrap().unwrap(), "{\"existing\":true}");
    }
    #[test]
    fn missing_is_distinct_from_corrupt_or_unreadable() {
        let dir = tempfile::tempdir().unwrap();
        assert_eq!(read_entry(dir.path(), KEYS[4]).unwrap(), None);
        let path = entry_path(dir.path(), KEYS[4]).unwrap();
        fs::write(&path, b"corrupt").unwrap();
        assert!(read_entry(dir.path(), KEYS[4]).is_err());
        assert_eq!(fs::read_to_string(path).unwrap(), "corrupt");
    }
    #[test]
    fn shopping_and_last_recovery_slot_preserve_exact_values() {
        let dir = tempfile::tempdir().unwrap();
        for key in ["glass-notes.shopping.v1", "glass-notes.recovery.before.10"] {
            write_entry(dir.path(), key, "{\"shopping\":\"1.2300\"}").unwrap();
            assert_eq!(read_entry(dir.path(), key).unwrap().unwrap(), "{\"shopping\":\"1.2300\"}");
            remove_entry(dir.path(), key).unwrap();
            assert_eq!(read_entry(dir.path(), key).unwrap(), None);
        }
        assert!(entry_path(dir.path(), "glass-notes.recovery.before.11").is_err());
        assert!(entry_path(dir.path(), "glass-notes.shopping.v2").is_err());
    }
    #[test]
    fn recovery_slots_are_bounded_and_remove_restores_absence() {
        let dir = tempfile::tempdir().unwrap();
        for key in &KEYS[5..] {
            write_entry(dir.path(), key, "{\"exact\":\"1.2300\"}").unwrap();
            remove_entry(dir.path(), key).unwrap();
            assert_eq!(read_entry(dir.path(), key).unwrap(), None);
            remove_entry(dir.path(), key).unwrap();
        }
        assert!(remove_entry(dir.path(), "../outside").is_err());
        assert!(entry_path(dir.path(), "glass-notes.recovery.before.11").is_err());
    }
}
