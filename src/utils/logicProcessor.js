class Manager{
    constructor(){
        this.items = []
        this.memory = Array(256).fill(10)
        this.pc = 0
        this.acc = 0
        this.z = 1
        this.n = 0
    }

    do(name , ...args){
        const functionName = "_" + name;
        if(this[functionName]) {
            this[functionName].apply(this, args)
            const snapshot = {acc: this.acc, pc : this.pc, memory: this.memory}
            this.items.push(snapshot)
            console.log(this.items)
            return snapshot
        }
    }
    undo(){
        if(!this.items.length) return 
        if(this.items.length != 1) this.items.pop()
        const {acc, pc, memory} = this.items.at(-1)
        this.acc = acc
        this.pc = pc
        this.memory = memory
        return {acc, pc, memory} 
    }

    _setMemory(memory){
        this.memory = memory
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
    _sta(address){
        this.memory[address] =  this.acc
        this.pc++
    }
    _lda(address){
        this.acc = this.memory[address] 
        this._check_z_n()
        this.pc++
    }
    _add(address){
        this.acc += this.memory[address] 
        this._check_z_n()
        this.pc++
    }
    _or(address){
        this.acc *= this.memory[address] 
        this._check_z_n()
        this.pc++
    }
    _and(address){
        this.acc &= this.memory[address] 
        this._check_z_n()
        this.pc++
    }
    _not(){
        this.acc = ~this.acc 
        this.pc++
    }
    _jmp(address){
        this.pc = address
    }
    _jz(address){
        if(this.z) this.pc = address
        else this.pc++
    }
    _jn(address){
        if(this.n) this.pc = address
        else this.pc++
    }
    
    
}

export default Manager