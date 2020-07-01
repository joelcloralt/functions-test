exports.handler = (event, context, callback) => {
  console.log("WHAT's HAPPENING?", event)
  callback(null, {
    statusCode: 200,
    body: "hello world"
  });
};