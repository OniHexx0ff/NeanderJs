<template>
  <div class="panel prevent-select">

    <div class="editor">
      <TextEditor ref="editor_ref"></TextEditor>
    </div>

    <div class="visor">
      <div class="visor__holder">
        <p>ACC</p>
        <p>{{ acc_value }}</p>
      </div>
      <div class="visor__holder">
        <p>PC</p>
        <p>{{ pc_value }}</p>
      </div>
      <div class="visor__holder">
        <p>N</p>
        <p> {{ n_value }}</p>
      </div>
      <div class="visor__holder">
        <p>Z</p>
        <p> {{ z_value }}</p>
      </div>
    </div>
    <div class="controls">
      <div class="controls__holder">
        <button @click="compile()">Carregar</button>
        <button @click="reset()">Resetar</button>
      </div>

      <div class="controls__holder">
        <fieldset @change="radioChanged($event)">
          <legend>Escolha como executar o programa:</legend>

          <div>
            <input type="radio" id="pp" name="executar" value="pp" checked>
            <label for="pp">Passo a passo</label>
          </div>

          <div>
            <input type="radio" id="at" name="executar" value="at">
            <label for="at">Automaticamente</label>
          </div>
        </fieldset>
      </div>

      <div :class="{disabled: instruction_mode == 'pp' }" class="controls__holder">
        <label for="time">Tempo de instrução (seg):</label>
        <input type="number" id="time" name="time" v-model="instruction_time_ref">
      </div>

      <div v-if="instruction_mode == 'pp' " class="controls__holder">
        <button class="button-step" :class="{disabled: !is_compiled}" @click="step(-1)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
               stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"/>
          </svg>
        </button>
        <button class="button-step" :class="{disabled: !is_compiled}" @click="step(1)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
               stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/>
          </svg>
        </button>
      </div>
      <div v-else-if="instruction_mode == 'at'" class="controls__holder">
        <button  :class="{disabled: !is_compiled}" @click="run()"> Executar</button>
        <button  :class="{disabled: !is_compiled}" @click="stop()"> Parar</button>
      </div>

    </div>

    <ul class="data" ref="data_ref"></ul>

  </div>

</template>

<script setup>
import TextEditor from "./TextEditor.vue";
import {onMounted, ref} from "vue";
import Manager from "../utils/logicProcessor";

const data_ref = ref(null);
const editor_ref = ref(null);
const acc_value = ref("0");
const instruction_time_ref = ref('1')
const pc_value = ref("0");
const n_value = ref("0");
const z_value = ref("1");
const instruction_mode = ref("pp")
const is_running = ref(false)
const current_interval = ref(null)
const is_compiled = ref(false);
let manager;
let lastTarget;

function _generateDataCells() {
  let cellNumber = 0;
  for (let i = 0; i < 32; i++) {
    const holder = document.createElement("li");
    for (let j = 0; j < 8; j++) {
      if (j % 8==0)
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
            currentChar.charCodeAt()!=10
        )
    ) {
      if (currentChar.charCodeAt()==10) currentChar = " ";
      if (!(currentChar==" " && lastChar==" ")) result.push(currentChar);
      lastChar = currentChar;
    }
  }
  if (str.length > 0 && str[str.length - 1]!=" ")
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
  if (!target.innerHTML.trim().length || target.innerHTML.trim()==="<br>")
    target.innerHTML = "00";
}

function _keyDown(event) {
  if (event.key!="Delete" && event.key!="Backspace") {
    if (
        !(
            (event.key.toLowerCase().charCodeAt() >= 97 && event.key.toLowerCase().charCodeAt() <= 102) ||
            (event.key.toLowerCase().charCodeAt() >= 48 && event.key.toLowerCase().charCodeAt() <= 57)
        )
    )
      event.preventDefault();
  }
}

function _keyUp({target}) {
  if (target.innerHTML.length > 3) {
    target.innerHTML = target.innerHTML.slice(0, 3);
    _setCaretPosition(target, 3);
  }
}

function _updateFromProcessor(values) {
  acc_value.value = values.acc;
  pc_value.value = values.pc;
  n_value.value = values.n;
  z_value.value = values.z;
  _changeData(values.memory)
}

function _manageExecution() {
  current_interval.value = setInterval(() => step(1), parseFloat(instruction_time_ref.value) * 1000)
}

function radioChanged(event) {
  instruction_mode.value = event.target.value
}

function manageClick({target}) {
  const cell = target.closest(".cell");
  if (lastTarget) {
    lastTarget.removeEventListener("keydown", _keyDown);
    lastTarget.removeEventListener("keyup", _keyUp);
  }
  if (lastTarget && lastTarget!==target) _resetCell(lastTarget);
  if (!cell) return;
  cell.addEventListener("keydown", _keyDown);
  cell.addEventListener("keyup", _keyUp);
  lastTarget = cell;
}

function step(direction) {
  _updateFromProcessor(manager.step(direction))
}

function compile() {
  const tokens = _parse(editor_ref.value.code.trim());
  const htmlData = Array.from(
      document.querySelectorAll(".cell:not(.indicator)")
  );
  if (tokens.length) {
    for (let index = 0; index < tokens.length; index++) {
      htmlData[index].innerHTML = tokens[index];
    }
  }
  manager.setMemory(Uint8Array.from(document.querySelectorAll(".cell:not(.indicator)"), el => el.innerHTML));
  is_compiled.value = true;
}

function reset() {
  is_compiled.value = false
  _updateFromProcessor(manager.reset())
}

function run() {
  _manageExecution()
}

function stop() {
  clearInterval(current_interval.value)
}

onMounted(() => {
  _generateDataCells();
  manager = new Manager();
  window.addEventListener("click", manageClick);
});
</script>

<style scoped>
.panel {
  width: 100%;
  height: 1000px;
  /*background-color: white;*/
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-auto-columns: 100%;
  gap: 1em;
}

.panel > * {
  border-radius: 0.28em
}

.editor {
  flex-basis: 70%;
  height: 100%;
  width: 100%;
  background-color: gray;
  overflow-y: scroll;
  grid-column: 1/3;
  grid-row: 2/4;
  box-shadow: 0 0 0 2px var(--panel-color);
}

.visor {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem;
  width: 100%;
  height: 100%;
  grid-row: 1;
  grid-column: 2/3;
  background-color: var(--panel-color);
  color: var(--primary-color)

}

.data {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  height: 100%;
  width: fit-content;
  overflow: scroll;
  background-color: var(--panel-color);
  color: var(--primary-color);
  grid-row: 1/4;
  grid-column: 3/4;
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

.visor__holder p {
  width: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

}

button {
  background-color: var(--button-color);
  color: var(--primary-color);
  font-size: 1rem;
  display: flex;
}
.button-step svg{
  height: 20px;
  stroke-width: 3px;
  color: var(--primary-color);
}

.controls {
  height: 100%;
  width: 100%;
  background-color: #304433;
  grid-row: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem;
}

.controls__holder {
  width: 100%;
  /*background-color: greenyellow;*/
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.disabled {
  pointer-events: none;
  filter: grayscale(0.6);
  opacity: 0.6;
}

</style>
