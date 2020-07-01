exports.handler = (event, context, callback) => {
    console.log("RECEIVING DATA", event.body);

    let body = event.body;

    if (body === null || body === undefined) {
        //return some default if nothing was passed
        body = {title: "Assistant to the regional manager", name: "Oscar"}       
    } else {
      body = JSON.parse(event.body)
    }
    

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({title: "Assistant to the regional manager", name: body.name}),
    });
  };