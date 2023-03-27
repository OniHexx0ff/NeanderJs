const address_map = new Map([
    [0, "nop"],
    [1, "sta"],
    [2, "lda"],
    [3, "add"],
    [4, "or"],
    [5, "and"],
    [6, "not"],
    [8, "jmp"],
    [9, "jn"],
    [10, "jz"],
    [15, "hlt"],
]);

class Manager {
    items = []
    memory = []
    pc = 0
    acc = 0
    z = 1
    n = 0
    end = false

    set acc(value) {
        this.acc = Uint8Array.of(value)
    }

    setMemory(memory) {
        this.memory = memory
    }

    reset(){
        this.memory = new Array(256).fill(0)
        this.items = []
        this.pc = 0
        this.acc = 0
        this.z = 1
        this.n = 0
        this.end = false
        return this._getStatusResponse()
    }

    step(direction) {
        if (direction > 0) {
            if (this.end) return this._getCurrentStatus()
            return this._do(this.memory[this.pc])
        } else {
            return this._undo()
        }
    }

    _getCurrentStatus() {
        return {acc: Uint8Array.of(this.acc)[0], pc: this.pc, memory: this.memory, end: this.end, z: this.z, n: this.n}
    }

    _getStatusResponse() {
        return {acc: this.acc, pc: this.pc, memory: this.memory, z: this.z, n: this.n}
    }

    _do(name, ...args) {
        const functionName = "_" + address_map.get(name);
        if (this[functionName]) {
            this.items.push(this._getCurrentStatus())
            this[functionName].apply(this, args)

            return this._getCurrentStatus()
        }
    }

    _undo() {
        if (this.items.length <= 0) return this._getCurrentStatus()
        const {acc, pc, memory, end, z, n} = this.items.pop()
        this.acc = acc
        this.pc = pc
        this.memory = memory
        this.end = end
        this.z = z
        this.n = n
        return this._getStatusResponse()
    }

    _getFromMemory() {
        return this.memory[this.memory[this.pc + 1]]
    }

    _setMemory(value) {
        this.memory[this.memory[this.pc + 1]] = value
    }

    _check_z_n() {
        if (this.acc >= 128) this.n = 1
        else this.n = 0

        if (this.acc==0) this.z = 1
        else this.z = 0
    }

    _nop() {
        this.pc++
    }

    _sta() {
        this._setMemory(this.acc)
        this.pc += 2
    }

    _lda() {
        this.acc = this._getFromMemory()
        this._check_z_n()
        this.pc += 2
    }

    _add() {
        this.acc += this._getFromMemory()
        this._check_z_n()
        this.pc += 2
    }

    _or() {
        this.acc *= this._getFromMemory()
        this._check_z_n()
        this.pc += 2
    }

    _and() {
        this.acc &= this._getFromMemory()
        this._check_z_n()
        this.pc += 2
    }

    _not() {
        this.acc = ~this.acc
        this.pc++
    }

    _jmp() {
        this.pc = this._getFromMemory()
    }

    _jn() {
        if (this.z) {
            this.pc = this._getFromMemory()
        } else this.pc += 2
    }

    _jz() {
        if (this.n) {
            this.pc = this._getFromMemory()
        } else this.pc += 2
    }

    _hlt() {
        this.pc++
        this.end = true
    }


}

export default Manager