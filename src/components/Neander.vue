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

        <div class="visor__button-holder">
          <button @click="compile()">Compilar programa</button>
          <button v-if="isCompiled" @click="stepFn(1)">+</button>
          <button v-if="isCompiled" @click="stepFn(-1)">-</button>
        </div>
      </div>

      <div class="editor">
        <TextEditor ref="editor_ref"></TextEditor>
      </div>
    </div>
    <div class="right">
      <ul @click="manageClick($event)" ref="data_ref"></ul>
    </div>
  </div>
</template>

<script setup>
import TextEditor from "./TextEditor.vue";
import { onMounted, ref } from "vue";
import Manager from "../utils/logicProcessor";
const data_ref = ref(null);
const editor_ref = ref(null);
const acc_value = ref("000");
const pc_value = ref("000");
const isCompiled = ref(false);
const stepFn = ref(() => {});
let manager;
let lastSelected;
let lastInput;

function _keyPressed(event) {
  if (+event.target.value > 256) event.target.value = 256;
  if (+event.target.value < 0) event.target.value = 0;

  lastSelected.innerHTML = event.target.value;
}

function _changeData(memory) {
  const element = document.querySelectorAll(".cell:not(.indicator)");
  for (let j = 0; j < memory.length; j++) {
    element[j].innerHTML = String(memory[j]).padStart(2, "0");
  }
}

function _parse(str) {
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
  if (str[str.length - 1] != " ") result.push(str[str.length - 1]);
  result = result.join("").toLowerCase().split(" ");
  const instructions = result.filter(function (number) {
    return number % 2 !== 0;
  });
  const address = result.filter(function (number) {
    return number % 2 == 0;
  });
  return [instructions, address];
}

function manageClick({ target }) {
  target = target.closest(".cell");
  if (!target) return;
  if (lastSelected) {
    lastSelected.style.display = "flex";
    lastInput.removeEventListener("keyup", _keyPressed);
    lastInput.remove();
  }
  const input = document.createElement("input");
  target.style.display = "none";
  target.parentElement.insertBefore(input, target);
  input.focus();
  input.addEventListener("keyup", _keyPressed);
  lastSelected = target;
  lastInput = input;
}
function generateDataCells() {
  let cellNumber = 0;
  for (let i = 0; i < 256; i++) {
    const holder = document.createElement("li");
    for (let j = 0; j < 8; j++) {
      if (j % 8 == 0)
        holder.insertAdjacentHTML(
          "beforeend",
          `<div class="cell indicator">
        ${i.toString(16).padStart(2, "0").toUpperCase()}:
        </div> <div class="spacer"></div>`
        );
      holder.insertAdjacentHTML(
        "beforeend",
        `<div data-index="${cellNumber}" class='cell'>00</div>`
      );
      cellNumber++;
    }
    data_ref.value.append(holder);
  }
}

function generateStep(instruction, address) {
  let i = 0;
  return function fn(...args) {
    if (args[0] == 1) {
      if (instruction[i] == "hlt") return;
      const { acc, pc, memory } = manager.do(instruction[i], address[i]);
      this.acc_value = acc;
      this.pc_value = pc;
      i = pc;
      _changeData(memory);
    } else {
      const { acc, pc, memory } = manager.undo();
      this.acc_value = acc;
      this.pc_value = pc;
      i = pc;
      _changeData(memory);
    }
  };
}

function compile() {
  manager.do(
    "setMemory",
    Array.from(
      document.querySelectorAll(".cell:not(.indicator)"),
      (el) => +el.innerHTML
    )
  );
  const [instruction, address] = _parse(editor_ref.value.code.trim());
  stepFn.value = generateStep(instruction, address);
  isCompiled.value = true;
}

onMounted(() => {
  generateDataCells();
  manager = new Manager();
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
  background-color: red;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: flex-start;
  flex-wrap: wrap;
  padding: 1rem;
  flex-basis: 70%;
  height: 200px;
  /* background-color: yellow; */
}
.visor__holder {
  height: 60px;
  width: 300px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 40px;
  font-weight: 800;
  /* background-color: green; */
}
.visor__button-holder {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.visor__button-holder button {
  padding: 1rem;
  font-size: 20px;
  cursor: pointer;
}
.visor__holder div {
  /* background-color: red; */
  text-align: center;
}
</style>
