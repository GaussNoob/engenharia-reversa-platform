#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn session_entry() -> Result<keyring::Entry, String> {
    let api = option_env!("NUCLEO_API_URL").unwrap_or("http://localhost:3060");
    keyring::Entry::new("com.nucleo.estudo", &format!("session:{}", api))
        .map_err(|_| "Armazenamento seguro indisponível.".into())
}
#[tauri::command]
fn session_get() -> Result<Option<String>, String> {
    match session_entry()?.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(_) => Err("Não foi possível ler a sessão protegida.".into()),
    }
}
#[tauri::command]
fn session_set(token: String) -> Result<(), String> {
    if token.is_empty() || token.len() > 4096 {
        return Err("Sessão inválida.".into());
    }
    session_entry()?
        .set_password(&token)
        .map_err(|_| "Não foi possível proteger a sessão.".into())
}
#[tauri::command]
fn session_clear() -> Result<(), String> {
    match session_entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(_) => Err("Não foi possível remover a sessão.".into()),
    }
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            session_get,
            session_set,
            session_clear
        ])
        .run(tauri::generate_context!())
        .expect("Não foi possível iniciar o Núcleo.");
}
