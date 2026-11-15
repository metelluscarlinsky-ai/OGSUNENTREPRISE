fetch('https://ogsunentreprise.onrender.com/api/partner/webhook/sale', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: "ogsun_d61ec6668912d695406d96b374c7881c",
    referral_code: "OGSUN-0001",
    customer_name: "Test Node.js",
    amount: 1000,
    site_source: "TEST NODE"
  })
})
.then(r => r.json())
.then(d => console.log("Repons:", d))
.catch(e => console.error("Erè:", e));
