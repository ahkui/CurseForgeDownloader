module.exports = (m) => m.map((mod) => {
    const d = {
        // Key: mod.key,
        Name: mod.name,
        URL: mod.url || mod.mod_url,
    }
    if (mod.isLatest != undefined) d.isLatest = mod.isLatest
    if (mod.enable != undefined) d.Enable = mod.enable
    return d
});
