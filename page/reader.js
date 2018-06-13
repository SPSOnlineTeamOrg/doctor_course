const fs = require("fs")
const xml = require('xml-js')
const util = require("util")

function print(item) {
  console.log(util.inspect(item, {showHidden: false, depth: null}))
}


const path ='PatientList.xml'
function loadxml(path) {
  const raw = fs.readFileSync(path, 'utf-8');
  return xml.xml2js(raw)
    .elements
}

// go down the xml tree to depth `depth`
function delve(item, depth) {
  for (let i = 0; i < depth; ++i)
    item = item.elements[0]
  return item
}

// convert an parsed xml to json
function convert(arr, f=item=>item, id='name') {
  const obj = {}
  for (let item of arr)
    obj[item[id]] = f(item)
  return obj
}

function assert(a) {
  if (!a)
    throw "assertion error"
}

// change html to html5
function htmlparse(html, path='') {
  if (!html) 
    return html
  html = html
    .replace(/<(.|)TEXTFORMAT.*?>/gi, '')
    .replace(/<(.|)FONT.*?>/gi, '')
    .replace(/<(.|)P.*?>/gi, '<p>')
    .replace(/\.swf/gi, '.png')
    .replace(/src=\"(?!(http|www))/gi, `src=\"`+path)
    .replace(/src=\'(?!(http|www))/gi, `src=\'`+path)
    .replace(/href=\"(?!(http|www))/gi, `href=\"`+path)
    .replace(/href=\'(?!(http|www))/gi, `href=\'`+path)
  return html
}

// Display Object is a collective class
// the is a superclass of each 
// Inbox, History, Procedure, and Management
// These items only contain rawhtml
class Display {

  constructor(data, path) {
    if (!data)
      this.visible = false
    else
      this.visible = data.attributes.visible === 'true'

    if (!data || !data.elements)
      this.items = []
    else
      this.items = data.elements.map(item => ({
          title : item.attributes.title,
          body : delve(item, 4).cdata 
            ? htmlparse(delve(item, 4).cdata, path)
            : delve(item, 7).text 
            // cdata is not recorded as cdata 
      }))   // so you have to dig deeper into p to get this out
  }

  transfer() {
    return {
      visible : this.visible,
      items : this.items
    }
  }
}


class ListItem {

  constructor(data, keys) {
    // this.keys = keys
    const item = convert(data.elements)
    this.name = item.xhtml.elements[0].text // not pretty
    for (const key of this.keys())
      if (item[key] && item[key].elements)
        this[key] = item[key].elements[0].text

  }

  static readlist(list, cons) {
    if (!list || !list.elements)
      return []
    else
      return list.elements.map(i => new this(i))
  }

  transfer() {
    const obj = {}
    for (const key of this.keys())
      if (this[key] !== undefined)
        obj[key] = this[key]
    return obj
  }

}


class Physical {

  constructor(_data, path) {
    if (!_data.elements || !_data.elements.length) {
      this.data = { title : '', body : '' }
      this.sign = []
      return
    }
    const [sign, data] = _data.elements
    if (data.name !== "data")
      [data, sign] = [sign, data]
    this.visible = _data.attributes.visible === 'true'
    this.data = {
      title : data.attributes.title,
      body : delve(data, 4).cdata
        ? htmlparse(delve(data, 4).cdata, path)
        : delve(data, 7).text
    }
    this.sign = sign.elements
      .map(i => convert(i.elements, x=>x.elements))
      .map(i => ({
        name : i.name[0].text,
        units : i.units[0].cdata
          ? htmlparse(i.units[0].cdata, path) 
          : i.units[0].text,
        ident : i.ident[0].text,
        value : i.value ? i.value[0].text : undefined,
      }))
      .filter(i => i.value)
  }

  transfer() {
    return {
      sign : this.sign,
      data : this.data,
      visible : this.visible
    }
  }
}



class Investigate {

  constructor(data, path) {

    function readresult(data) {
      const newobj = convert(data)
      if (!newobj.units || !newobj.units.elements)
        newobj.units = { elements : [{ text : '' }]}
      if (!newobj.name.elements
       || !newobj.value.elements
       || !newobj.range.attributes) return

      const getrange = a => 
        [a.pre, a.min, a.mid, a.max]
          .map(i => i ? i : '')
          .join('')

      return {
        range : getrange(newobj.range.attributes),
        name  : newobj.name.elements[0].text,
        value : newobj.value.elements[0].text,
        units : newobj.units.elements
          .map(i => i.name === "sup"
            ? `<sup>${i.elements[0].text}</sup>`
            : i.text)
          .join("")
      }
    }

    function readtable(item, path) {
      return {
        name : item.name,
        title : item.attributes.title,
        data : item.name === "data"
          ? htmlparse(delve(item, 4).cdata, path)
          : item.elements
              .map(i => readresult(i.elements))
              .filter(i => i)
      }
    }

    function main(self, data, path) {
      self.data = []
      self.results = []
      self.visible = data.attributes.visible === 'true'
      if (!data.elements)
        return

      for (const i of data.elements)
        if (i.name === "data")
          self.data.push(readtable(i, path))
        else
          self.results.push(readtable(i, path))
    }

    return main(this, data, path)
  }

  transfer() {
    return {
      data : this.data,
      results : this.results,
      visible : this.visible
    }
  }
}

class Inbox extends Display {}
class History extends Display {}
class Procedure extends Display {}
class Management extends Display {}
class Drug extends ListItem {
  keys() { return ['name', 'state', 'dose'] }
}

class Problem extends ListItem {
  keys() { return ['name', 'state'] }
}
class GuideItem {

  constructor(guideitem, path='', qindex=undefined) {
    this.name = guideitem.name
    this.title = guideitem.attributes.title
    if (this.name === "data") {
      this.cdata = htmlparse(delve(guideitem, 4).cdata, path)
      if (this.cdata.includes("swf"))
        console.log(this.cdata)
    } else if (this.name === "openquestion") {
      let [question, response] = guideitem.elements
      question = delve(question, 3)
      response = delve(response, 3)
      assert(response.type === "cdata")
      this.type = question.type
      this.questionindex = qindex
      this.questiontext = htmlparse(question[question.type], path)
      this.responsetext = htmlparse(response.cdata, path)
    } else
      throw "either data or open question, not neither"
  }

  static readlist(guides, path='') {
    let qindex = 0
    let guidelist = []
    for (let g of guides) {
      qindex += g.name === "openquestion"
      guidelist.push(new GuideItem(g, path, qindex))
    }
    return guidelist
  }

  transfer() {
    return {
      name          : this.name,
      type          : this.type,
      title         : this.title,
      cdata         : this.cdata,
      questiontext  : this.questiontext,
      responsetext  : this.responsetext,
      questionindex : this.questionindex,
    }
  }
}

class Event {

  constructor(event, guide, path) {
    this.title = event.attributes.title
    this.elapsed = event.attributes.elapsedtime
    guide = guide ? guide.elements : []
    const rawdata = convert(event.elements)
    this.data = {
      inbox       : new Inbox(rawdata.inbox, path),
      history     : new History(rawdata.history, path),
      procedure   : new Procedure(rawdata.officeprocedure, path),
      management  : new Management(rawdata.management, path),
      physical    : new Physical(rawdata.physical, path),
      investigate : new Investigate(rawdata.investigate, path),
      druglist    : Drug.readlist(rawdata.druglist),
      problemlist : Problem.readlist(rawdata.problemlist),
      guidelist   : GuideItem.readlist(guide, path)
    }
  }

  transfer() {
    return {
      title   : this.title,
      elapsed : this.elapsed,
      data    : {
        inbox       : this.data.inbox.transfer(),
        history     : this.data.history.transfer(),
        procedure   : this.data.procedure.transfer(),
        management  : this.data.management.transfer(),
        physical    : this.data.physical.transfer(),
        investigate : this.data.investigate.transfer(),
        druglist    : this.data.druglist.map(x => x.transfer()),
        problemlist : this.data.problemlist.map(x => x.transfer()),
        guidelist   : this.data.guidelist.map(x => x.transfer()),
      }
    }
  }

}

class GuideList {

  constructor(guide) {
    this.dict = {}
    for (const item of guide[0].elements)
      this.dict[item.attributes.title] = item
  }
}

class Patient {

  constructor(data, guide, path) {
    this.path = path
    // this.rawdata = data
    // this.rawguide = guide
    this.events = []
    this.guide = new GuideList(guide)
    const dict = this.guide.dict
    const extractor = i => i.elements && i.elements.length
      ? i.elements[0].text
      : undefined
    for (const item of data[0].elements) {
      if (item.name === 'character')
        this.person = convert(item.elements, extractor),
        this.person.face = path+item.attributes.filename
      else {
        const title = item.attributes.title
        this.events.push(new Event(item, dict[title], path))
      }
    }
  }

  transfer() {
    return {
      path    : this.path,
      person  : this.person,
      event   : this.events.map(e => e.transfer())
    }
  }

  static readfile(base, path) {
    const data = loadxml(base + path)
    return data[0]
      .elements
      .map(p => p.attributes)
      .map(a => ({
        folder : base + a.folder + "/",
        data   : loadxml(`${base}${a.folder}/${a.file}`),
        guide  : loadxml(`${base}${a.folder}/${a.studyguidefile}`)
      }))
      .map(i => new Patient(i.data, i.guide, i.folder))
  }

}


const p = Patient.readfile('../page/data/data/', path)
const data = p.map(p => p.transfer())
const string = JSON.stringify(data)

fs.writeFile("../page/data/data.json", string, (err) => console.log(err))
