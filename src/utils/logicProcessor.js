const address_map = new Map([
    ["00", "nop"],
    ["01", "sta"],
    ["02", "lda"],
    ["03", "add"],
    ["04", "or"],
    ["05", "and"],
    ["06", "not"],
    ["08", "jmp"],
    ["09", "jn"],
    ["10", "jz"],
    ["15", "hlt"],
  ]);

class Manager{
    constructor(){
        this.items = []
        this.memory = Array(256).fill(10)
        this.pc = 0
        this.acc = 0
        this.z = 1
        this.n = 0
        this.tracker = 0
        this.end = false
    }


    setMemory(memory){
        console.log(memory)
        this.memory = memory
    }


    step(direction){
        if(direction > 0) {
            if (this.end) return this.items.at(-1)
            console.log(this.memory[this.tracker])
            return this._do(this.memory[this.tracker])
        }
        else{
            console.log(this.memory[this.tracker])
            return this._undo()
        }
    }
    _getCurrentStatus(){
        return {acc: this.acc, pc : this.pc, memory: this.memory, end: this.end, tracker: this.tracker, z: this.z, n: this.n}
    }
    _getStatusResponse(){
        return {acc: this.acc, pc : this.pc, memory: this.memory, z: this.z, n: this.n}
    }

    _do(name , ...args){
        const functionName = "_" + address_map.get(name);
        if(this[functionName]) {
            this.items.push(this._getCurrentStatus())
            this[functionName].apply(this, args)
            this.tracker+=2 ;
            return this._getCurrentStatus()
        }
    }
    _undo(){
        if(this.items.length <= 0) return this._getCurrentStatus()  
        console.log(this.items.length)
        const {acc, pc, memory, end, tracker, z, n} = this.items.pop()
        console.log(this.items)
        this.acc = acc
        this.pc = pc
        this.memory = memory
        this.end = end
        this.tracker = tracker
        this.z = z
        this.n = n
        return this._getStatusResponse()
    }
  
    _getMemory(){
        return +this.memory[+this.memory[this.tracker +1]]
    }
    _setMemory(value){
        this.memory[+this.memory[this.tracker +1]] = value
    }
    _check_z_n(){
        if(this.acc >= 128) this.n = 1
        else this.n = 0

        if(this.acc == 0) this.z = 1
        else this.z = 0
    }
    _nop(){
        this.pc++
    }
    _sta(){
        this._setMemory(this.acc)   
        this.pc++
    }
    _lda(){
        this.acc = this._getMemory()
        this._check_z_n()
        this.pc++
    }
    _add(){
        this.acc += this._getMemory()
        this._check_z_n()
        this.pc++
    }
    _or(){
        this.acc *= this._getMemory()
        this._check_z_n()
        this.pc++
    }
    _and(){
        this.acc &= this._getMemory()
        this._check_z_n()
        this.pc++
    }
    _not(){
        this.acc = ~this.acc 
        this.pc++
    }
    _jmp(){
        this.pc = this._getMemory()
        this.tracker = this.pc
    }
    _jn(){
        if(this.z){
        this.pc = this._getMemory()
        this.tracker = this.pc
        } 
        else this.pc++
    }
    _jz(){
        if(this.n) 
        {
            this.pc = this._getMemory()
            this.tracker =  this.pc
        }
        else this.pc++
    }
    _hly(){
        this.pc++
        this.end = true
    }

    
}

export default Manager