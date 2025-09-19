(function() {
    const siteId = window.__SITE_ID__;
    const eventData = {
      site_id: siteId,
      url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
    };
  
    fetch("http://127.0.0.1:8000/api/events/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    }).catch(err => console.error("Tracking error:", err));
  })();
  