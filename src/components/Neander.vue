<template>
  <div class="panel">
    <div class="left">
      <div class="visor">
        <div class="visor__holder">
          <div>ACC</div>
          <div>{{ acc_value }}</div>
        </div>
        <div class="visor__holder">
          <div>PC</div>
          <div>{{ pc_value }}</div>
        </div>
        <div class="visor__holder">
          <div>N</div>
          <div>{{ acc_value }}</div>
        </div>
        <div class="visor__holder">
          <div>Z</div>
          <div>{{ pc_value }}</div>
        </div>

      </div>

      <div class="editor">
        <TextEditor ref="editor_ref"></TextEditor>
      </div>
    </div>
    <div class="right">
      <ul ref="data_ref"></ul>
    </div>
  </div>
  <div class="buttons">
    <div class="buttons__holder">
      <button @click="compile()">Rodar programa</button>
    </div>
    <div class="buttons__holder buttons__holder-step">
      <button class="button-step" :class="{'button-active': isCompiled}" @click="step(1)">+</button>
      <button class="button-step" :class="{'button-active': isCompiled}" @click="step(-1)">-</button>
    </div>
  </div>
</template>

<script setup>
import TextEditor from "./TextEditor.vue";
import { onMounted, ref } from "vue";
import Manager from "../utils/logicProcessor";
const data_ref = ref(null);
const editor_ref = ref(null);
const acc_value = ref("0");
const pc_value = ref("0");
const isCompiled = ref(false);
let manager;
let lastTarget;
let currentTarget;

function step(direction) {
  const { acc, pc, memory } = manager.step(direction);
  this.acc_value = acc;
  this.pc_value = pc;
}

function _setCaretPosition(el, position) {
  const range = document.createRange();
  const sel = window.getSelection();

  range.setStart(el.childNodes[0], position);
  range.collapse(true);

  sel.removeAllRanges();
  sel.addRange(range);
}

function _changeData(memory) {
  const element = document.querySelectorAll(".cell:not(.indicator)");
  for (let j = 0; j < memory.length; j++) {
    element[j].innerHTML = String(memory[j]).padStart(2, "0");
  }
}

function _parse(str) {
  let instruction_map = new Map([
    ["nop", "00"],
    ["sta", "01"],
    ["lda", "02"],
    ["add", "03"],
    ["or", "04"],
    ["and", "05"],
    ["not", "06"],
    ["jmp", "08"],
    ["jn", "09"],
    ["jz", "10"],
    ["hlt", "15"],
  ]);
  let result = [];
  let lastChar = "";
  let currentChar;
  for (let index = 0; index < str.length; index++) {
    currentChar = str[index];
    if (!str[index + 1]) break;
    if (
      !(
        currentChar.charCodeAt() >= 0 &&
        currentChar.charCodeAt() <= 31 &&
        currentChar.charCodeAt() != 10
      )
    ) {
      if (currentChar.charCodeAt() == 10) currentChar = " ";
      if (!(currentChar == " " && lastChar == " ")) result.push(currentChar);
      lastChar = currentChar;
    }
  }
  if (str.length > 0 && str[str.length - 1] != " ")
    result.push(str[str.length - 1]);

  if (str.length > 0) {
    result = result
      .join("")
      .toLowerCase()
      .split(" ")
      .map((tk) => (instruction_map.get(tk) ? instruction_map.get(tk) : tk));
  }
  return result;
}

function _resetCell(target) {
  if (!target.innerHTML.trim().length || target.innerHTML.trim() === "<br>")
    target.innerHTML = "00";
}

function _keyDown(event) {
  console.log(event.key.charCodeAt())
  if (event.key != "Delete" && event.key != "Backspace") {
    if (
      !(
        (event.key.toLowerCase().charCodeAt() >= 97 && event.key.toLowerCase().charCodeAt() <= 102) ||
        (event.key.toLowerCase().charCodeAt() >= 48 && event.key.toLowerCase().charCodeAt() <= 57)
      )
    )
      event.preventDefault();
  }
}

function _keyUp({ target }) {
  if (target.innerHTML.length > 3) {
    target.innerHTML = target.innerHTML.slice(0, 3);
    _setCaretPosition(target, 3);
  }
}

function manageClick({ target }) {
  const cell = target.closest(".cell");
  if (lastTarget) {
    lastTarget.removeEventListener("keydown", _keyDown);
    lastTarget.removeEventListener("keyup", _keyUp);
  }
  if (lastTarget && lastTarget !== target) _resetCell(lastTarget);
  console.log(cell);
  if (!cell) return;
  cell.addEventListener("keydown", _keyDown);
  cell.addEventListener("keyup", _keyUp);
  lastTarget = cell;
}
function generateDataCells() {
  let cellNumber = 0;
  for (let i = 0; i < 32; i++) {
    const holder = document.createElement("li");
    for (let j = 0; j < 8; j++) {
      if (j % 8 == 0)
        holder.insertAdjacentHTML(
          "beforeend",
          `<div class="cell indicator">
        ${(i * 8 + j).toString(16).padStart(2, "0").toUpperCase()}:
        </div> <div class="spacer"></div>`
        );
      holder.insertAdjacentHTML(
        "beforeend",
        `<div data-index="${cellNumber}" contenteditable="true" class='cell'>00</div>`
      );
      cellNumber++;
    }
    data_ref.value.append(holder);
  }
}

function compile() {
  const tokens = _parse(editor_ref.value.code.trim());
  const htmlData = Array.from(
    document.querySelectorAll(".cell:not(.indicator)")
  );
  console.log(tokens);
  if (tokens.length) {
    for (let index = 0; index < tokens.length; index++) {
      htmlData[index].innerHTML = tokens[index];
    }
  }
  manager.setMemory(
    Array.from(
      document.querySelectorAll(".cell:not(.indicator)"),
      (el) => el.innerHTML
    )
  );
  isCompiled.value = true;
}

onMounted(() => {
  generateDataCells();
  manager = new Manager();
  window.addEventListener("click", manageClick);
});
</script>

<style scoped>
.panel {
  width: 100%;
  height: 800px;
  background-color: white;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  border: 1px solid rgba(0, 0, 0, 0.3);
}
.editor {
  flex-basis: 70%;
  height: 600px;
  background-color: gray;
  overflow-y: scroll;
}
.left {
  flex-basis: 65%;
}
.right {
  flex-basis: 35%;
  height: 800px;
  overflow-y: scroll;
  background-color: #f2f2f2;
}
.right ul {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  /* border: 5px solid red; */
}

.visor {
  background-color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem;
  flex-basis: 70%;
  height: 200px;
}
.visor__holder {
  height: 60px;
  width: 300px;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  font-size: 40px;
  font-weight: 800;
  /* background-color: green; */
}
.buttons{
  background-color: green;
  height: 120px;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 1;
}
.buttons__holder {
  /* background-color: red; */
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.buttons__holder-step{
  justify-content: space-evenly;
}
button {
  background-color: white;
  border-radius: 0.28em;
  padding: 1rem;
  font-size: 20px;
  cursor: pointer;
}

.button-step{
  background-color: gray;
  border: none;
  cursor: default;
  pointer-events: none;
}
.button-active{
  background-color: white;
  cursor: pointer;
  pointer-events: all;
}

.visor__holder div {
  width: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>
