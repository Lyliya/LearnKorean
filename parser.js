const fs = require("fs");

const word = fs.readFileSync("words.txt", "utf8");

let lines = word.split("\n");

let equals = [];
for (let i = 0; i < lines.length; i++) {
	equals.push(lines[i].split("="));
	equals[i][0] = equals[i][0].trim();
	equals[i][1] = equals[i][1].trim();
}
//console.log(equals);

const json = { words: [] };
for (let i = 0; i < equals.length; i++) {
	json.words.push({
		en: equals[i][1],
		kr: equals[i][0],
	});
}

console.log(json);

fs.writeFileSync("words2.json", JSON.stringify(json));
