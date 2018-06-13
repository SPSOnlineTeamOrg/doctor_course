// known bugs
// : can't carry over font faces because they are not supported in html5

const fs = require("fs")
const xml = require('xml-js')
const util = require("util")
const bb = require("billboard.js")
console.log(bb)

const print = obj => console.log(util.inspect(obj, false, 7))


// const path ='naominighthawk/naominighthawk.xml'
const path ='patientlist.xml'
// const data = xml.xml2js(string)
function loadxml(path) {
  const raw = fs.readFileSync(path, 'utf-8');
  return xml.xml2js(raw)
    .elements
}

function delve(item, depth) {
  for (let i = 0; i < depth; ++i)
    item = item.elements[0]
  return item
}

function convert(arr, key) {
  const obj = {}
  for (let item of arr)
    obj[item.name] = key ? item[key] : item
  return obj
}



function compile(path, base='./data/') {

  function parse(patient) {

    function parseevent(event) {

      function setter(item) {
        return {
          title : item.attributes.title,
          body : delve(item, 4).cdata
        }
      }

      function mapper(name) {
        return {
          visible : event[name].attributes.visible === 'true',
          items : event[name].elements.map(setter)
        }
      }

      function readinvestigate(investigate) {

        function readresult(data) {
          const newobj = convert(data)
          if (!newobj.units || !newobj.units.elements)
            newobj.units = { elements : [{ text : '' }]}
          if (!newobj.name.elements
           || !newobj.value.elements
           || !newobj.range.attributes) return

          return {
            range : newobj.range.attributes,
            name  : newobj.name.elements[0].text,
            value : newobj.value.elements[0].text,
            units : newobj.units.elements
              .map(i => ({
                type : i.name === "sup" ? 'sup' : 'flat',
                text : i.name === "sup" ? i.elements[0].text : i.text }))
          }
        }

        function readtable(item) {
          return {
            name : item.name,
            title : item.attributes.title,
            data : item.name === "data"
              ? delve(item, 4)
              : item.elements
                  .map(i => readresult(i.elements))
                  .filter(i => i)
          }
        }

        function main(investigate) {
          const data = [], results = []
          for (let i of investigate.elements)
            if (i.name === "data")
              data.push(readtable(i))
            else
              results.push(readtable(i))
          return {
            data,
            results,
            visible : investigate.attributes.visible === 'true'
          }
        }

        return main(investigate)
      }

      function readphysical(physical) {
        if (!physical.elements.length)
          return
        const [sign, data] = physical.elements
        if (data.name !== "data")
          [data, sign] = [sign, data]
        const subdata = delve(data, 4).cdata
        const subsign = sign.elements
          .map(i => convert(i.elements, "elements"))
          .map(i => ({
            name : i.name[0].text,
            ident : i.ident[0].text,
            value : i.value ? i.value[0].text : undefined,
            units : i.units[0].cdata
          }))
          .filter(i => i.value)

        return {
          sign : subsign,
          data : subdata, 
          visible : physical.attributes.visible === 'true',
        }
      }

      function readlist(list, keys) {
        const read = i => {
          const obj = { name : i.xhtml.elements[0].text }
          for (const key of keys)
            obj[key] = i[key] && i[key].elements 
              ? i[key].elements[0].text 
              : null
          return obj
        }
        const items = list.elements
          .map(i => convert(i.elements))
          .map(i => read(i))

        return items
      }

      function main(event) {
        const names = [ 
          'inbox', 'history', 'management', 'officeprocedure',
          'physical', 'investigate','problemlist', 'druglist' ]

        for (const name of names) {
          if (!event[name])
            event[name] = { attributes : { visible : 'true' }}
          event[name].elements || (event[name].elements = [])
        }

        return {
          inbox       : mapper('inbox') ,
          history     : mapper('history'),
          procedure   : mapper('officeprocedure'),
          management  : mapper('management'),
          physical    : readphysical(event.physical),
          investigate : readinvestigate(event.investigate),

          druglist    : readlist(event.druglist, ['state', 'dose']),
          problemlist : readlist(event.problemlist, ['state']),
        }
      }

      return main(event)
    }


    function parsedata(data) {
      const newdat = { events : [] }
      for (let item of data[0].elements) {
        if (item.name === "event")
          newdat.events.push(item)
        else {
          const obj = item.elements.slice(0)
          obj.forEach(i => i.elements
            ? i.elements = i.elements[0].text
            : i.elements = null)
          newdat.person = convert(obj, "elements")
          newdat.person.face = item.attributes.filename
        }
      }
      newdat.events = newdat.events
        .map(e => ({
          id : e.attributes.id,
          ...parseevent(convert(e.elements))
        }))

      return newdat
    }

    function parseguide(guide) {
      const test = guide[0].elements
        .map(i => i.elements
          .filter(i => i.name == 'data')
          .map(i => delve(i, 4)))
      // print(guide[0].elements)
      // print(test)
    }

    function main(patient) {
      const {data, guide} = load(patient)
      const result = parsedata(data)
      result.guide = parseguide(guide)
      return result
    }

    return main(patient)
  }

  function load(patient) {
    const p = patient.attributes
    const pathdata = `${base}${p.folder}/${p.file}`
    const pathguide = `${base}${p.folder}/${p.studyguidefile}`
    const data = loadxml(pathdata)
    const guide = loadxml(pathguide)

    return { data, guide }
  }

  function main(path) {
    const data = loadxml(base+path)
    const list = data[0].elements
    return list.map(parse)
  }

  return main(path)
}

compile(path)