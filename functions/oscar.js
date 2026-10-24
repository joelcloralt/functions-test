exports.handler = (event, context, callback) => {

    let body = event.body;

    if (body === null || body === undefined) {
        //return some default if nothing was passed
        body = {title: "Assistant to the regional manager", name: "Oscar"}       
    } else {
      try {
        body = JSON.parse(event.body);
      } catch {
        callback(null, { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) });
        return;
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        callback(null, { statusCode: 400, body: JSON.stringify({ error: "Invalid body" }) });
        return;
      }
    }
    

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({title: "Assistant to the regional manager", name: body.name}),
    });
  };
