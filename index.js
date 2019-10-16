const Koa = require("koa");
const Router = require("koa-router");
const session = require("koa-session");
const shuffle = require("shuffle-array");
const koaBody = require("koa-body");
const render = require("koa-ejs");
const path = require("path");
const crypto = require("crypto");

const app = new Koa();
const router = new Router();

render(app, {
	root: path.join(__dirname, "views"),
	layout: false,
	viewExt: "html",
	cache: false,
	//debug: true,
});

const words = require("./words2.json").words;

const r = ["en", "kr"];

app.keys = ["This is a secret"];

const save = {};

const sh = w => {
	return new Promise((resolve, reject) => {
		resolve(shuffle(w));
	});
};

router.get("/join", async ctx => {
	const w = await sh(words);

	const id = crypto.randomBytes(32).toString("hex");
	ctx.session.id = id;
	save[id] = {
		random: w,
		answers: [],
		score: 0,
	};

	console.log("You join the game");
	//console.log(ctx.session);
	ctx.body = "You joined the game";
});

router.get("/next", ctx => {
	const s = save[ctx.session.id];

	if (!s) {
		console.log("No session");
		return (ctx.status = 400);
	}
	const i = s.answers.length;
	if (i > s.random.length) {
		ctx.status = 400;
		ctx.body = "No more";
	} else {
		const lang = r[Math.floor(Math.random() * r.length)];
		ctx.body = {
			lang: lang,
			word: s.random[i][lang],
		};
	}
});

router.get("/end", ctx => {
	const s = save[ctx.session.id];

	if (!s) {
		return (ctx.status = 400);
	}
	delete save[ctx.session.id];
	ctx.body = s;
});

router.post("/answer", ctx => {
	const s = save[ctx.session.id];

	if (!s.random) {
		return (ctx.status = 500);
	}
	const response = ctx.request.body.answer;
	if (!response) {
		return (ctx.status = 400);
	}

	// Check answer
	const realAnswer = s.random.find(
		x =>
			x[ctx.request.body.lang].toLowerCase() ===
			ctx.request.body.ask.toLowerCase()
	);
	const inv = ctx.request.body.lang == "en" ? "kr" : "en";
	const i = s.answers.length + 1;
	const lang = r[Math.floor(Math.random() * r.length)];
	const next =
		i >= s.random.length
			? {}
			: {
					lang: lang,
					word: s.random[i][lang],
			  };

	if (
		ctx.request.body.answer.toLowerCase() == realAnswer[inv].toLowerCase()
	) {
		save[ctx.session.id].answers.push({
			good: true,
			correct: realAnswer[inv],
			lang: ctx.request.body.lang,
			ask: ctx.request.body.ask,
			answer: ctx.request.body.answer,
		});
		save[ctx.session.id].score += 1;
		ctx.body = {
			good: true,
			word: realAnswer,
			next: next,
		};
	} else {
		save[ctx.session.id].answers.push({
			good: false,
			correct: realAnswer[inv],
			lang: ctx.request.body.lang,
			ask: ctx.request.body.ask,
			answer: ctx.request.body.answer,
		});
		ctx.body = {
			good: false,
			word: realAnswer,
			next: next,
		};
	}
});

router.get("/", async ctx => {
	await ctx.render("game");
});

app.use(koaBody());
app.use(session(app));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
