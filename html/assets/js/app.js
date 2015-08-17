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


/*var includes = [
'controllers/user',
'controllers/profile',
'controllers/search',
'controllers/chat',
'directives/block',
'directives/file-model'
];

jQuery(function($){
for (var i=0;i<includes.length;i++)
{
$.getScript('./assets/js/'+includes[i]+'.js');
}
})*/