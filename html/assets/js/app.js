'use strict';

var modules = [
'myApp.user',
'myApp.profile',
'myApp.search',
'myApp.chat'
];
for (var i=0;i<modules.length;i++)
{
angular.module(''+modules[i], []);
}
modules.unshift('ngRoute');
console.log('modules:', modules);

/* App Module */
angular.module('myApp', modules);
