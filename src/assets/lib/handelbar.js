

var Handlebars = require('handlebars-runtime');

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        });

Handlebars.registerHelper('isdefined', function (value) {
   return value !== undefined;
 });

 