var project = require('project');
project.setId(89);
project.setTitle('My First Node.js Project');
project.setStartedDate('17 Aug 2014 10:30');
console.log(project.getData());

var task = require('task');
task.setId(63);
task.setTitle('My First Node.js Task');
console.log(task.getData());

var project2 = require('project');
project.setId(83);
console.log(project2.getData());
