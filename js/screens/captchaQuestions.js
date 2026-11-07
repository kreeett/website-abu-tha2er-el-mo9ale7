"use strict";
// Step 1: "Are you a robot?" → "Are you sure?" → "Are you REALLY sure?"
// The buttons swap order and styling between steps to trip people up.
const ROBOT_STEPS = [
    { question: "Are you a robot?", correct: "no", yesFirst: true, yesClass: "btn btn-primary btn-lg", noClass: "btn btn-light btn-sm" },
    { question: "Are you sure?", correct: "yes", yesFirst: false, yesClass: "btn btn-danger btn-sm", noClass: "btn btn-success btn-lg" },
    { question: "Are you REALLY sure?", correct: "yes", yesFirst: true, yesClass: "btn btn-link btn-sm tiny-yes", noClass: "btn btn-primary btn-lg" },
];
let robotStepIndex = 0;
function startRobotQuestions() {
    robotStepIndex = 0;
    renderRobotStep();
    showScreen("robot");
}
function renderRobotStep() {
    const step = ROBOT_STEPS[robotStepIndex];
    byId("robot-step").textContent = String(robotStepIndex + 1);
    byId("robot-question").textContent = step.question;
    const yes = document.createElement("button");
    yes.type = "button";
    yes.className = step.yesClass;
    yes.textContent = "Yes";
    yes.addEventListener("click", () => answerRobot("yes"));
    const no = document.createElement("button");
    no.type = "button";
    no.className = step.noClass;
    no.textContent = "No";
    no.addEventListener("click", () => answerRobot("no"));
    const holder = byId("robot-buttons");
    holder.replaceChildren(...(step.yesFirst ? [yes, no] : [no, yes]));
}
function answerRobot(answer) {
    const step = ROBOT_STEPS[robotStepIndex];
    if (answer !== step.correct) {
        flash("🤖 Robot detected. Beginning again from the beginning.");
        startRobotQuestions();
        return;
    }
    robotStepIndex++;
    if (robotStepIndex >= ROBOT_STEPS.length) {
        startSorting();
    }
    else {
        renderRobotStep();
    }
}
