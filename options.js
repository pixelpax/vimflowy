
// Saves options to chrome.storage
function save_options() 
{
  var currentVimflowyTheme = document.getElementById('Vimflowy_Theme').value;
  chrome.storage.sync.set({
    vimflowyTheme: currentVimflowyTheme 
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // default values
  chrome.storage.sync.get({
    vimflowyTheme: 'none'
  }, function(items) {
    document.getElementById('Vimflowy_Theme').value = items.vimflowyTheme;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);