
import Vue from 'vue'
const { bb } = require('billboard.js')

function assert(t) {
  if (!t) {
    console.trace()
    throw "Assertion Error"
  }
}

class App {

  constructor() {

    function loadapp(self) {

      const tmpl = Vue.compile(require('../data/tmpl/index.vue'))
      const data = { 
        event   : 0, 
        person  : 0,
        data    : self.data,
        app     : self,
        active  : '',
        modalon : true
      }

      const computed = {
        text : () => self.data[data.person].event[data.event].data[data.active],
        p : () => self.data[data.person],
        e : () => self.data[data.person].event[data.event]
      }

      const options = {
        el              : '#mainapp',
        data            : data,
        computed        : computed,
        render          : tmpl.render,
        staticRenderFns : tmpl.staticRenderFns,
      }

      return new Vue(options)
    }

    function main(self) {
      self.temp = { person: 0, event: 0 }
      self.data = require("../data/data.json")
      self.vue = loadapp(self)
    }

    return main(this)

  }

  summarize(event) {
    const keys = [
      "inbox", "history", "physical",
      "procedure", "investigate", "management"
    ]
  }

  log(item) {
    console.log(item)
  }

  setactive(active) {
    this.vue.active = "nothing"
    const e = this.vue.e
    e.recordshown = false
    for (let g of e.data.guidelist)
      g.recordshown = false
    setTimeout(() => this.vue.active = active, 10)
  }

  druglist() {
    const l = data[this.vue.person]
      .event
      .map(i => i.data.druglist)
    const active = {}
    const table = []
    for (let event = 0; event < l.length; ++event)
      for (let item of l[event])
        if (active[item.name] !== undefined) {

          item = Object.assign({event}, item)
          const dat = active[item.name]
          if (item.state !== "end")
            console.log("not end", item, active)
          if (dat.dose !== item.dose)
            console.log(dat.dose, item.dose)
          table[dat.index].end = event
          delete active[item.name]

        } else {

          item = Object.assign({
            start : event, 
            index : table.length
          }, item)

          if (item.state !== "start")
            console.log("not start:", item, active)
          active[item.name] = item
          table.push(item)
        }

    return table
  }

  problemlist() {
    const l = data[this.vue.person]
      .event
      .map(i => i.data.problemlist)
    const active = {}
    const seen = new Set()
    const table = []
    for (let event = 0; event < l.length; ++event) 
      for (let item of l[event]) {
        if (item.name in active && item.state !== undefined) {
          const dat = active[item.name]
          // assert(item.state === "end")
          table[dat.index].end = event
          delete active[item.name]
        } else {
          item = Object.assign({
            index : table.length
          }, item)
          if (item.state === "start")
            item.start = event,
            active[item.name] = item,
            table.push(item)
          else if (!seen.has(item.name)) {
            if (item.name.toLowerCase() === "health maintenance")
              table.push(item)
          }
          seen.add(item.name)
        }
      }

    return table
  }

  // TODO Modify Charts Here

  charts() {
    const l = this.data[this.vue.person]
      .event
      .map(i => i.data.physical.sign)
    const measurements = {}
    for (let event = 0; event < l.length; ++event) {
      for (let item of l[event]) {
        const ident = item.ident.toLowerCase()
        measurements[ident] = measurements[ident] || []
        item = Object.assign({event}, item)
        measurements[ident].push(item)
      }
    }

    const run = () => {
      for (let key in measurements) {
        const m = measurements[key].filter(i => i.event <= this.vue.event)
        const name = `#charts-${key}`
        const cats = m.map(i => this.vue.p.event[i.event].title)
        const cols = [key].concat(m.map(i => parseInt(i.value)))
        const unit = m[0].units.replace("&deg;C", "Celcius")
        bb.generate({
          bindto: name,
          axis: {
            x: { 
              type: "category",
              categories: cats,
              tick : { width : 50 },
              height : 50
            },
            y: { tick: { format: i => `${i} ${unit}` } }
          },
          data: {
            columns: [ cols ],
            types: { [key]: "bar", },
            colors: { [key] : "#ccffff", },
          },
          bar: {
              width: {
                ratio: 0.1,
                max: 20
              }
            },
          legend : { show: false }
        })
      }
    }

    setTimeout(run, 0)
    return Object
      .keys(measurements)
      .map(i => [i, measurements[i]])
  }

}

const app = window.app = new App()
const data = window.data = require("../data/data.json")
console.log(data)
