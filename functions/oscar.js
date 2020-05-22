exports.handler = (event, context, callback) => {
    callback(null, {
      statusCode: 200,
      body:       JSON.stringify({
          title: "Hello",
          name: "Oscar" 
      }),
    });
  };