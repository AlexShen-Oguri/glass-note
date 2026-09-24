#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod storage;
use std::sync::Mutex;
use tauri::{Manager, State, webview::{NewWindowResponse, WebviewWindowBuilder}};

struct StorageLock(Mutex<()>);

#[tauri::command]
fn read_local_entry(app: tauri::AppHandle, lock: State<'_, StorageLock>, key: String) -> Result<Option<String>, String> {
    let _guard = lock.0.lock().map_err(|_| "storage-unavailable")?;
    let root = app.path().app_data_dir().map_err(|_| "storage-directory-failed")?.join("data");
    storage::read_entry(&root, &key)
}

#[tauri::command]
fn write_local_entry(app: tauri::AppHandle, lock: State<'_, StorageLock>, key: String, value: String) -> Result<(), String> {
    let _guard = lock.0.lock().map_err(|_| "storage-unavailable")?;
    let root = app.path().app_data_dir().map_err(|_| "storage-directory-failed")?.join("data");
    storage::write_entry(&root, &key, &value)
}

#[tauri::command]
fn remove_local_entry(app: tauri::AppHandle, lock: State<'_, StorageLock>, key: String) -> Result<(), String> {
    let _guard = lock.0.lock().map_err(|_| "storage-unavailable")?;
    let root = app.path().app_data_dir().map_err(|_| "storage-directory-failed")?.join("data");
    storage::remove_entry(&root, &key)
}

#[tauri::command]
async fn export_lab_file(content: String, extension: String, kind: Option<String>) -> Result<bool, String> {
    if !["json", "md"].contains(&extension.as_str()) { return Err("invalid-file-type".into()); }
    if content.len() as u64 > storage::FILE_LIMIT { return Err("file-too-large".into()); }
    if extension == "json" { storage::validate_json(&content)?; }
    let kind = kind.unwrap_or_else(|| "lab".into());
    if !["lab", "backup"].contains(&kind.as_str()) || (kind == "backup" && extension != "json") { return Err("invalid-file-type".into()); }
    tauri::async_runtime::spawn_blocking(move || {
        let chosen = rfd::FileDialog::new()
            .set_file_name(format!("glass-notes-{kind}.{extension}"))
            .add_filter("Glass Notes", &[extension.as_str()]).save_file();
        let Some(mut path) = chosen else { return Ok(false); };
        if path.extension().is_none() { path.set_extension(&extension); }
        if path.extension().and_then(|v|v.to_str()).map(str::to_ascii_lowercase) != Some(extension) {
            return Err("invalid-file-type".into());
        }
        storage::write_atomic(&path, &content)?;
        Ok(true)
    }).await.map_err(|_| "file-dialog-failed")?
}

#[tauri::command]
async fn import_lab_file() -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let chosen = rfd::FileDialog::new().add_filter("Glass Notes JSON", &["json"]).pick_file();
        let Some(path) = chosen else { return Ok(None); };
        if path.extension().and_then(|v|v.to_str()).map(str::to_ascii_lowercase).as_deref() != Some("json") {
            return Err("invalid-file-type".into());
        }
        let value = storage::read_bounded(&path)?;
        storage::validate_json(&value)?;
        Ok(Some(value))
    }).await.map_err(|_| "file-dialog-failed")?
}

fn local_url(url: &tauri::Url) -> bool {
    url.username().is_empty() && url.password().is_none() && url.port().is_none() &&
        ((url.scheme() == "tauri" && url.host_str() == Some("localhost")) ||
        (url.scheme() == "http" && url.host_str() == Some("tauri.localhost")))
}

fn open_source(url: &tauri::Url) {
    if ["https", "http"].contains(&url.scheme()) && url.host_str().is_some() && url.username().is_empty() && url.password().is_none() {
        let _ = open::that_detached(url.as_str());
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .manage(StorageLock(Mutex::new(())))
        .invoke_handler(tauri::generate_handler![read_local_entry, write_local_entry, remove_local_entry, export_lab_file, import_lab_file])
        .setup(|app| {
            let window = WebviewWindowBuilder::from_config(app.handle(), &app.config().app.windows[0])?
                .on_navigation(|url| {
                    if local_url(url) { true } else { open_source(url); false }
                })
                .on_new_window(|url, _features| {
                    open_source(&url);
                    NewWindowResponse::Deny
                }).build()?;
            // Storage paths and protocol stay stable across candidate versions.
            window.set_title("Glass Notes")?;
            #[cfg(debug_assertions)]
            if std::env::var("GLASS_NOTES_DESKTOP_DEBUG").as_deref() == Ok("1") {
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Glass Notes could not start");
}
