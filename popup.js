// let changeColor = document.getElementById("changeColor");
// let form = document.querySelector('form');
const button = document.querySelector("#start");
const rgpa = document.querySelector("#rgpa .result");
const agpa = document.querySelector("#agpa .result");
const rscore = document.querySelector("#rscore .result");
const ascore = document.querySelector("#ascore .result");
const container = document.querySelector(".container");

chrome.storage.sync.get(
	["allGpa", "allScore", "requiredGpa", "requiredScore"],
	({ allGpa, allScore, requiredGpa, requiredScore }) => {
		agpa.innerText = allGpa;
		ascore.innerText = allScore;
		rgpa.innerText = requiredGpa;
		rscore.innerText = requiredScore;
	}
);

button.addEventListener(
	"click",
	async function (event) {
		event.preventDefault();
		let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		chrome.scripting.executeScript(
			{
				target: { tabId: tab.id },
				function: calculateGpa,
			},
			function (injectionResults) {
				try {
					const result = injectionResults[0].result;
					const [allGpa, allScore, requiredGpa, requiredScore] = result;
					container.classList.add("pre-animation");
					setTimeout(function () {
						agpa.innerText = allGpa;
						ascore.innerText = allScore;
						rgpa.innerText = requiredGpa;
						rscore.innerText = requiredScore;
					}, 550);
					setTimeout(function () {
						container.classList.remove("pre-animation");
					}, 600);

					chrome.storage.sync.set({
						allGpa,
						allScore,
						requiredGpa,
						requiredScore,
					});
				} catch (error) {
					console.error(error);
				}
			}
		);
	},
	false
);

// When the button is clicked, inject setPageBackgroundColor into current page
// changeColor.addEventListener("click", async () => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

// });

// The body of this function will be executed as a content script inside the
// current page
function calculateGpa() {
	try {
	const iframe = document.getElementById("iframeMain");
	const iDocument = iframe.contentWindow.document;
	const table = iDocument.querySelectorAll("table")[3];
	const headers = Array.from(table.querySelectorAll("thead tr th"));
	const trs = table.querySelectorAll("tbody tr");
	const formatNumber = (number) => (Math.round(number * 100) / 100).toFixed(2);
	let totalAllCredit = 0,
		totalRequiredCredit = 0,
		totalAllScore = 0,
		totalRequiredScore = 0,
		totalAllGpa = 0,
		totalRequiredGpa = 0;
	const scoreArr = [90, 85, 82, 78, 75, 72, 68, 64, 60, 0];
	const gpaArr = [4, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.5, 1.0, 0];
	const requiredColumn =
		headers.findIndex((item) => item.innerText === "课程性质") === -1
			? headers.findIndex((item) => item.innerText === "课程类别")
			: headers.findIndex((item) => item.innerText === "课程性质");
	const creditColumn = headers.findIndex((item) => item.innerText === "学分");
	const scoreColumn = headers.findIndex(
		(item) => item.innerText === "最终" || item.innerText === "成绩"
	);
	const classNameColumn = headers.findIndex(item => item.innerText === '课程名称');
	console.log(requiredColumn, creditColumn, scoreColumn);
	for (let i = 0; i < trs.length; i++) {
		const tds = trs[i].querySelectorAll("td");
		console.log(
			"required",
			tds[requiredColumn].innerText,
			tds[requiredColumn].innerText === "必修课" ||
				tds[requiredColumn].innerText === "必修"
		);
		const isRequired =
			tds[requiredColumn].innerText === "必修课" ||
			tds[requiredColumn].innerText === "必修";
		const credit = Number(tds[creditColumn].innerText);
		const score = Number(tds[scoreColumn].innerText);
		if (
			isNaN(score) ||
			isNaN(credit) ||
			tds[classNameColumn].innerText.includes('重修')
		) {
			console.log(`${tds[classNameColumn].innerText}因为分数或学分不为数字, 或重修,没有纳入统计,请自行计算`);
			continue;
		}
		const gpa = gpaArr[scoreArr.findIndex((item) => score >= item)];
		// console.log(
		// 	"课程名称",
		// 	tds[classNameColumn],
		// 	"是否必修",
		// 	isRequired,
		// 	"学分",
		// 	credit,
		// 	"分数",
		// 	score,
		// 	"GPA",
		// 	gpa
		// );
		totalAllCredit += credit;
		totalAllGpa += gpa * credit;
		totalAllScore += score * credit;
		if (isRequired) {
			totalRequiredCredit += credit;
			totalRequiredGpa += gpa * credit;
			totalRequiredScore += score * credit;
		}
	}
	console.log("总学分", totalAllCredit, "必修学分", totalRequiredCredit, "总分数", totalAllScore, "总GPA", totalAllGpa);
	if (totalRequiredCredit !== 0 && totalAllCredit !== 0) {
		const allGpa = formatNumber(totalAllGpa / totalAllCredit),
			allScore = formatNumber(totalAllScore / totalAllCredit),
			requiredGpa = formatNumber(totalRequiredGpa / totalRequiredCredit),
			requiredScore = formatNumber(totalRequiredScore / totalRequiredCredit);
		return [allGpa, allScore, requiredGpa, requiredScore];
	} else if (totalAllCredit !== 0) {
		const allGpa = formatNumber(totalAllGpa / totalAllCredit),
			allScore = formatNumber(totalAllScore / totalAllCredit);
		return [allGpa, allScore, 0, 0];
	} else {
		return [0, 0, 0, 0];
	}
	} catch (error) {
		console.error(error);
		alert(`计算过程发生错误，请做以下确认：\n1、已选择所有学期成绩\n2、非Chrome浏览器，建议更换至Chrome进行尝试\n如果还未解决问题，请打开浏览器的开发者工具，选择Console(控制台)，截图微信咨询zlq1440169549`);
	}
}
