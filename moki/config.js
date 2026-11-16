// Gemeinsame Einstellungen für Moki und das Studio.
// Der Schlüssel ist der ÖFFENTLICHE (anon) Schlüssel von Supabase. Er darf im Browser stehen,
// weil die Datenbank nur über geprüfte Funktionen erreichbar ist (siehe Migration moki_studio_creations).
window.MOKI_CFG = {
  sbUrl: "https://lgztiptcaqjxufbmvpcv.supabase.co",
  sbKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenRpcHRjYXFqeHVmYm12cGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTAxNzUsImV4cCI6MjEwMzc2NjE3NX0.eKyv1VjyR57eYyWSoOf2AG1xO7QZq3KvbQ6cqTbjBuQ",
  mokiUrl: "https://mokiorg.netlify.app/",
  studioUrl: "https://mokiorg.netlify.app/studio.html"
};
