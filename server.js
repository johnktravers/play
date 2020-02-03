const app = require('./app.js')


//This is the code that is removed from index.js or app.js
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is running on http://localhost:${app.get('port')}`);
});
