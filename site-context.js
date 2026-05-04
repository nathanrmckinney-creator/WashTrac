const ACTIVE_SITE_KEY = "washtrac_active_site_id";
const ACTIVE_SITE_NAME_KEY = "washtrac_active_site_name";

async function getCurrentUser() {
  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) {
    window.location.href = "login.html";
    return null;
  }

  return data.user;
}

async function loadUserSites() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data: accessRows, error: accessError } = await client
    .from("user_site_access")
    .select("site_id, role")
    .eq("user_id", user.id);

  if (accessError) {
    console.error("Site access load error:", accessError);
    return [];
  }

  const siteIds = (accessRows || []).map(row => row.site_id).filter(Boolean);

  if (!siteIds.length) {
    return [];
  }

  const { data: sites, error: sitesError } = await client
    .from("sites")
    .select("id, name, address, organization_id")
    .in("id", siteIds);

  if (sitesError) {
    console.error("Sites load error:", sitesError);
    return [];
  }

  return sites || [];
}
function getActiveSiteId() {
  return localStorage.getItem(ACTIVE_SITE_KEY);
}

function getActiveSiteName() {
  return localStorage.getItem(ACTIVE_SITE_NAME_KEY) || "Select Site";
}

function setActiveSite(site) {
  if (!site?.id) return;

  localStorage.setItem(ACTIVE_SITE_KEY, site.id);
  localStorage.setItem(ACTIVE_SITE_NAME_KEY, site.name || "Selected Site");
}

async function ensureActiveSite() {
  const sites = await loadUserSites();

  if (!sites.length) {
    localStorage.removeItem(ACTIVE_SITE_KEY);
    localStorage.removeItem(ACTIVE_SITE_NAME_KEY);
    return null;
  }

  const savedSiteId = getActiveSiteId();
  const savedSite = sites.find(site => site.id === savedSiteId);

  if (savedSite) {
    setActiveSite(savedSite);
    return savedSite;
  }

  setActiveSite(sites[0]);
  return sites[0];
}

async function renderSiteSwitcher() {
  const select = document.getElementById("siteSwitcher");
  const label = document.getElementById("activeSiteLabel");

  if (!select && !label) return;

  const sites = await loadUserSites();
  const activeSite = await ensureActiveSite();

  if (label) {
    label.textContent = activeSite?.name || "No Site";
  }

  if (!select) return;

  select.innerHTML = "";

  sites.forEach(site => {
    const option = document.createElement("option");
    option.value = site.id;
    option.textContent = site.name;
    option.selected = site.id === activeSite?.id;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    const selected = sites.find(site => site.id === select.value);
    if (!selected) return;

    setActiveSite(selected);
    window.location.reload();
  });
}

async function requireActiveSite() {
  const activeSite = await ensureActiveSite();

  if (!activeSite) {
    alert("No site is connected to this account yet.");
    return null;
  }

  return activeSite.id;
}
