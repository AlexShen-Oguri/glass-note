import type {Locale} from '../domain/contracts';

const text = {
  home: ['Home', '首页', 'Accueil', 'Startseite', 'Inicio', '홈', 'ホーム', 'Home'],
  returnHome: ['Glass Notes · Home', 'Glass Notes · 返回首页', 'Glass Notes · Accueil', 'Glass Notes · Zur Startseite', 'Glass Notes · Inicio', 'Glass Notes · 홈으로', 'Glass Notes · ホームに戻る', 'Glass Notes · Torna alla home'],
  explore: ['Explore', '探索', 'Explorer', 'Entdecken', 'Explorar', '탐색', '探索', 'Esplora'],
  cabinet: ['Cabinet', '酒柜', 'Bar maison', 'Hausbar', 'Bar', '술장', '酒棚', 'Dispensa'],
  professional: ['Professional', '专业', 'Professionnel', 'Profi', 'Profesional', '전문', 'プロ', 'Professionale'],
  my: ['My notes', '我的', 'Mes notes', 'Meine Notizen', 'Mis notas', '내 기록', 'マイノート', 'Le mie note'],
  primaryNavigation: ['Primary navigation', '主导航', 'Navigation principale', 'Hauptnavigation', 'Navegación principal', '주요 탐색', 'メインナビゲーション', 'Navigazione principale'],
  professionalEyebrow: ['Professional workspace', '专业工作区', 'Espace professionnel', 'Profi-Arbeitsbereich', 'Espacio profesional', '전문 작업 공간', 'プロ向けワークスペース', 'Area professionale'],
  professionalIntro: [
    'Compare recipes and bottles, record trials, and study the source material behind each drink.',
    '比较配方与瓶款、记录试调，并研究每杯酒背后的来源资料。',
    'Comparez recettes et bouteilles, notez vos essais et étudiez les sources de chaque verre.',
    'Vergleiche Rezepte und Flaschen, dokumentiere Versuche und studiere die Quellen hinter jedem Drink.',
    'Compara recetas y botellas, registra pruebas y estudia las fuentes detrás de cada copa.',
    '레시피와 보틀을 비교하고, 실험을 기록하며, 한 잔의 출처 자료를 살펴보세요.',
    'レシピとボトルを比べ、試作を記録し、一杯の背景にある資料を読み解きます。',
    'Confronta ricette e bottiglie, registra le prove e studia le fonti dietro ogni drink.',
  ],
  myEyebrow: ['Personal notes', '个人札记', 'Notes personnelles', 'Persönliche Notizen', 'Notas personales', '개인 기록', '個人のノート', 'Note personali'],
  myTitle: ['My notes', '我的札记', 'Mes notes', 'Meine Notizen', 'Mis notas', '내 기록', 'マイノート', 'Le mie note'],
  myIntro: [
    'Return to saved recipes and review the preferences used across Glass Notes.',
    '回到已收藏的配方，并查看 Glass Notes 当前使用的偏好设置。',
    'Retrouvez vos recettes enregistrées et les préférences utilisées dans Glass Notes.',
    'Öffne gespeicherte Rezepte und prüfe die Einstellungen für Glass Notes.',
    'Vuelve a tus recetas guardadas y revisa las preferencias de Glass Notes.',
    '저장한 레시피로 돌아가고 Glass Notes에서 사용하는 설정을 확인하세요.',
    '保存したレシピに戻り、Glass Notesで使っている設定を確認できます。',
    'Ritrova le ricette salvate e controlla le preferenze usate in Glass Notes.',
  ],
  favoritesDescription: [
    'Exact source versions you saved for later.', '为以后保留的具体来源版本。', 'Les versions précises enregistrées pour plus tard.',
    'Exakte Quellversionen, die du gespeichert hast.', 'Versiones exactas que guardaste para después.', '나중을 위해 저장한 정확한 출처 버전입니다.',
    'あとで見返すために保存した、出典ごとのレシピです。', 'Le versioni esatte delle fonti salvate per dopo.',
  ],
  preferences: ['Preferences', '偏好设置', 'Préférences', 'Einstellungen', 'Preferencias', '환경설정', '設定', 'Preferenze'],
  preferencesDescription: [
    'Language, units and motion apply throughout the app. Change them with the controls above.',
    '语言、单位与动态偏好会应用到整个应用；可用上方控件随时调整。',
    'La langue, les unités et le mouvement s’appliquent partout. Modifiez-les avec les commandes ci-dessus.',
    'Sprache, Einheiten und Bewegung gelten in der ganzen App. Ändere sie oben.',
    'El idioma, las unidades y el movimiento se aplican en toda la app. Cámbialos arriba.',
    '언어, 단위, 모션 설정은 앱 전체에 적용됩니다. 위의 컨트롤에서 바꿀 수 있습니다.',
    '言語・単位・動きの設定はアプリ全体に反映されます。上の操作から変更できます。',
    'Lingua, unità e movimento valgono in tutta l’app. Modificali con i controlli qui sopra.',
  ],
  preferencesStorageWarning: [
    'Preference storage is unavailable. Changes may not persist after you close the app.',
    '暂时无法保存偏好设置；关闭应用后，本次更改可能不会保留。',
    'Le stockage des préférences est indisponible. Les modifications peuvent disparaître après la fermeture.',
    'Einstellungen können derzeit nicht gespeichert werden und nach dem Schließen verloren gehen.',
    'No se pueden guardar las preferencias. Los cambios podrían perderse al cerrar la app.',
    '환경설정을 저장할 수 없습니다. 앱을 닫으면 변경 사항이 유지되지 않을 수 있습니다.',
    '設定を保存できません。アプリを閉じると変更が残らない場合があります。',
    'Le preferenze non possono essere salvate. Le modifiche potrebbero non restare dopo la chiusura.',
  ],
  language: ['Language', '语言', 'Langue', 'Sprache', 'Idioma', '언어', '言語', 'Lingua'],
  units: ['Units', '单位', 'Unités', 'Einheiten', 'Unidades', '단위', '単位', 'Unità'],
  motion: ['Motion', '动态效果', 'Mouvement', 'Bewegung', 'Movimiento', '모션', '動き', 'Movimento'],
  motionOn: ['Playing', '播放中', 'Actif', 'Aktiv', 'Activo', '재생 중', '再生中', 'Attivo'],
  motionPaused: ['Paused', '已暂停', 'En pause', 'Pausiert', 'En pausa', '일시 정지', '一時停止', 'In pausa'],
  localData: ['On this device', '此设备上的记录', 'Sur cet appareil', 'Auf diesem Gerät', 'En este dispositivo', '이 기기의 기록', 'この端末の記録', 'Su questo dispositivo'],
  localDataDescription: [
    'Favorites and personal work stay on this device.', '收藏与个人工作记录保存在此设备上。', 'Les favoris et travaux personnels restent sur cet appareil.',
    'Favoriten und persönliche Arbeiten bleiben auf diesem Gerät.', 'Los favoritos y el trabajo personal permanecen en este dispositivo.', '즐겨찾기와 개인 작업은 이 기기에 저장됩니다.',
    'お気に入りと個人の作業はこの端末に保存されます。', 'Preferiti e lavori personali restano su questo dispositivo.',
  ],
  countLoading: ['Loading…', '正在读取…', 'Chargement…', 'Wird geladen…', 'Cargando…', '불러오는 중…', '読み込み中…', 'Caricamento…'],
  countUnavailable: ['Count unavailable', '数量暂不可用', 'Nombre indisponible', 'Anzahl nicht verfügbar', 'Cantidad no disponible', '개수 확인 불가', '件数を取得できません', 'Conteggio non disponibile'],
  savedRecipes: ['saved recipes', '个收藏配方', 'recettes enregistrées', 'gespeicherte Rezepte', 'recetas guardadas', '개의 저장된 레시피', '件の保存レシピ', 'ricette salvate'],
  labProjects: ['lab projects', '个实验项目', 'projets de laboratoire', 'Laborprojekte', 'proyectos de laboratorio', '개의 실험 프로젝트', '件の実験プロジェクト', 'progetti di laboratorio'],
} satisfies Record<string, readonly [string, string, string, string, string, string, string, string]>;

export type AppNavigationKey = keyof typeof text;
const locales: readonly Locale[] = ['en', 'zh', 'fr', 'de', 'es', 'ko', 'ja', 'it'];

export function appNavigationText(locale: Locale, key: AppNavigationKey) {
  return text[key][locales.indexOf(locale)] ?? text[key][0];
}
