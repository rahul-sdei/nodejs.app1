function test1([name, val]) { console.log("name:", name); console.log("val:", val); }
test1(["Rohit", 28])
test1(["Virat", 26])
function test2({name, val}) { console.log("name:", name); console.log("val:", val); }
test2({"name": "Rohit Sharma", "val": 27})
function test3({name: n, val: v}) { console.log("name:", n); console.log("val:", v); }
test3({"name": "V Kohli", "val": 25})
function test4({name: n, val: v, role: {main: r} }) { console.log("name:", n); console.log("val:", v); console.log("role:", r); }
test4({"name": "Virat Kohli", "val": 26, "role": {"main": "Captain"} })
let list = [10, 15, 20];
var [n1, ,n2] = list;
console.log("n1:", n1);
console.log("n2:", n2);
var [n1,n2,n3] = list;
let str = `hi, first num is ${n1}
second num ${n2}
third num ${n3}`;
console.log("str:", str);

list.map(n => { console.log("n:", n) })
list.map(n => console.log("n:", n) )
list.map(n => { n = n * 3; console.log("n:", n); return n; })
let names = [];
names.push({title: "Rohit Sharma", age: 28})
names.push({title: "Shikhar Dhawan", age: 27})
names.push({title: "Virat Kohli", age: 26})
names.map( ({title: n, age: v}) => { console.log("n:", n); console.log("v:", v); } )
names.map( ({title: n, age: v}) => { console.log("n:", n); console.log("v:", v); return n; } )
names.map( (title, age) => { console.log("n:", title); console.log("v:", age); return title; } )
names.map( ({title: n, age: v}, i) => { console.log("i:", i); console.log("n:", n); console.log("v:", v); return n; } )
let [a=1, b=2, c=3, d=25, e] = list;

function f (n1, n2, ...rest) {
    console.log("rest:", rest);
    let res = 0;
    for (n of [n1, n2, ...rest]) {
        res += parseInt(n);
    }
    return res;
}
let res = f (2, 3, 4, 5, 6);
console.log("res:", res);

let s = new Set();
s.add("hello").add("goodbye").add("hello");
s.size === 2;
s.has("hello") === true;
for (let key of s.values()) {
    console.log("key:", key);
}

let m = new Map();
m.set("hello", 42);
m.set(s, 34);
m.get(s) === 34;
m.size === 2;
s.add("ok");
for (let [key, val] of m.entries()) {
    console.log(`${key} => ${val}`);
}
