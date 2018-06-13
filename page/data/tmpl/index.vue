
<div class="h-100 ph-3">
  <div class="fixed top-5 h-middle vh-center"><big><b>Patient Viewer</b></big></div>

  <select
    v-model="person"
    class="p-choose fixed top-5 left-3 v-center"
    @change="event = 0, active = ''">
    <option v-for="(p, i) in data" v-bind:value="i">
      {{ p.person.name }}
    </option>
  </select>

  <select
    v-model="event"
    class="e-choose fixed top-5 right-5 v-center"
    @change="app.setactive(active)">
    <option v-for="(ev, i) in p.event" v-bind:value="i">
      {{ ev.title }}{{ ev.elapsed ? ' - ' + ev.elapsed : '' }}
    </option>
  </select>

  <div class="flex-column">
    <div class="flex-top pv-5"></div>
    <div class="flex-mid relative">
      <div class="flex-row">
        <div class="flex-left person relative">
          <table>
            <tr><td colspan="2" class="text-center">
              <img class="face" v-bind:src="p.person.face"/>
            </td></tr>
            <tr><td class="text-center p-1" colspan="2">
              {{ p.person.name }} ({{ p.person.sex }}, {{ p.person.age }})
            </td></tr>
            <tr class="v-top">
              <td class=" key"><b>Marital Status</b></td>
              <td class="value">{{ p.person.marital_status || p.person.maritalstatus }}</td>
            </tr><tr class="v-top">
              <td class=" key"><b>Education</b></td>
              <td class="value">{{ p.person.education }}</td>
            </tr><tr class="v-top">
              <td class=" key"><b>Occupation</b></td>
              <td class="value">{{ p.person.occupation }}</td>
            </tr><!-- <tr class="v-top">
              <td class=" key"> Language: </td>
              <td class="value">{{ p.person.language }}</td>
            </tr> --><tr class="v-top">
              <td class=" key"><b>Race/Ethnicity</b></td>
              <td class="value">
                {{ p.person.race }}{{ p.person.ethnicity ? '/'+p.person.ethnicity : '' }}
              </td>
            </tr>
            <tr><td></td></tr>
            <tr><td colspan="2">{{ p.person.social }}</td></tr>
          </table>

        <!-- THESE ARE THE FOUR BUTTONS ON THE LEFT -->
          <div class="absolute w-100 bottom-1 text-center">
            <input type="button"
              @click="app.setactive('records')"
              class="pointer pastinfo"
              value="Patient Records">
            <input type="button"
              @click="app.setactive('problemlist')"
              class="pointer pastinfo"
              value="Problem List">
            <input type="button"
              @click="app.setactive('druglist')"
              class="pointer pastinfo"
              value="Drug History">
            <input type="button"
              @click="app.setactive('charts')"
              class="pointer pastinfo"
              value="Patient Charts">
          </div>
        </div>

        <!-- THESE ARE THE BUTTONS ON THE TOP -->
        <div class="flex-mid relative">
          <div class="flex-column ph-3">
            <div class="flex-top">
              <!-- INBOX BUTTON -->
              <input
                v-if="e.data.inbox.visible"
                v-bind:class="
                  [!e.data.inbox.items.length
                   ? 'disabled'
                   :('inbox' === active
                   ? 'active'
                   : 'passive')]"
                type="button"
                class="pointer currinfo"
                @click="e.data.inbox.items.length
                    ? app.setactive('inbox')
                    : undefined"
                value="Inbox">
              <!-- HISTORY BUTTON -->
              <input
                v-if="e.data.history.visible"
                v-bind:class="
                  [!e.data.history.items.length
                   ? 'disabled'
                   :('history' === active
                   ? 'active'
                   : 'passive')]"
                type="button"
                class="pointer currinfo"
                @click="e.data.history.items.length
                      ? app.setactive('history')
                      : undefined"
                value="History">
              <!-- PHYSICAL BUTTON -->
              <input
                v-if="e.data.physical.visible"
                v-bind:class="
                  [!(e.data.physical.data.body || e.data.physical.sign.length)
                   ? 'disabled'
                   :('physical' === active
                   ? 'active'
                   : 'passive')]"
                type="button"
                class="pointer currinfo"
                @click="(e.data.physical.data.body
                    || e.data.physical.sign.length)
                     ? app.setactive('physical')
                     : undefined"
                value="Physical">
              <!-- PROCEDURE BUTTON -->
              <input
                v-if="e.data.procedure.visible"
                v-bind:class="
                  [!e.data.procedure.items.length
                   ? 'disabled'
                   :('procedure' === active
                   ? 'active'
                   : 'passive')]"
                type="button"
                class="pointer currinfo"
                @click="e.data.procedure.items.length
                      ? app.setactive('procedure')
                      : undefined"
                value="Procedure">
              <!-- INVESTIGATE BUTTON -->
              <input
                v-if="e.data.investigate.visible"
                v-bind:class="
                  [!(e.data.investigate.data.length || e.data.investigate.results.length)
                   ? 'disabled'
                   :('investigate' === active
                   ? 'active'
                   : 'passive')]"
                type="button"
                class="pointer currinfo"
                @click="(e.data.investigate.data.length
                    || e.data.investigate.results.length)
                       ? app.setactive('investigate')
                       : undefined"
                value="Investigate">
              <!-- MANAGEMENT BUTTON -->
              <input
                v-if="e.data.management.visible"
                v-bind:class="
                  [!e.data.management.items.length
                   ? 'disabled'
                   :('management' === active
                   ? 'active'
                   : 'passive')]"
                type="button"
                class="pointer currinfo"
                @click="e.data.management.items.length ? app.setactive('management') : 0"
                value="Management">

              <!-- STUDY GUIDES -->
              <input
                v-if="e.data.guidelist.length"
                v-bind:class="
                  [('studyguide' === active
                   ? 'active'
                   : 'passive')]"
                type="button"
                class="pointer currinfo"
                @click="app.setactive('studyguide')"
                value="Study Guide">
            </div>


            <!-- THESE ARE WHAT ARE DISPLAYED IN THE MAIN BOX -->
            <div class="flex-mid scroll pv-3 ph-1">
              <!-- MISCELLANEOUS -->
              <div v-if="['inbox', 'history', 'procedure', 'management'].includes(active)">
                <div v-for="item in e.data[active].items">
                  <p class="inherit-text" v-if="item.title"><b>{{ item.title }}</b><br></p>
                  <div
                      class="inherit-text"
                      v-if="item.body"
                      v-bind:style="{ 'font-family': 'cmu-serif' }"
                      v-html="item.body"></div>
                </div>
              </div>
              <!-- PHYSICAL -->
              <div v-if="active==='physical'">
                <div v-if="e.data.physical.sign.length">
                  <p><b> Vital Signs </b></p>
                  <div class="ph-3">
                    <table style="width:60%">
                      <tr v-for='item in e.data.physical.sign'>
                        <td class=" ph-1"><b>{{ item.name }}</b></td>
                        <td class="value text-left" v-html="`${item.value} ${item.units}`"></td>
                      </tr>
                    </table>
                  </div>
                  <br>
                </div>

                <div v-if="e.data.physical.data.title">
                  <b>{{ e.data.physical.data.title }}</b><br><br>
                </div>
                <div
                    v-if="e.data.physical.data.body"
                    v-html="e.data.physical.data.body">
                </div>
              </div>
              <!-- INVESTIGATE -->
              <div v-if="active==='investigate'">
                <div
                    v-for="r in e.data.investigate.results"
                    v-if="e.data.investigate.results.length">
                  <p><b>{{ r.title }}</b></p>
                  <div class="ph-3">
                    <table style="width:100%">
                      <tr>
                        <th class="text-left v-top ph-1"> Test </th>
                        <th class="text-left v-top value"> Result </th>
                        <th class="text-left v-top value"> Normal Range </th>
                      </tr>
                      <tr v-for='item in r.data'>
                        <td class="v-top ph-1"><b>{{ item.name }}</b></td>
                        <td class="v-top text-left value" v-html="`${item.value} ${item.units}`"></td>
                        <td class="v-top text-left value" v-html="`${item.range} ${item.units}`"></td>
                      </tr>
                    </table>
                  </div>
                </div>
                <div v-if="e.data.investigate.data.length" v-for="d in e.data.investigate.data">
                  <div v-if="d.title"><b> {{ d.title }} </b><br></div>
                  <div v-if="d.data" v-html="d.data"></div>
                </div>
              </div>

              <!-- PATIENT RECORDS -->
              <div v-if="active==='records'">
                <div v-for="e of p.event.slice(0, event+1)">
                  <div></div>
                  <div class="record-title"
                    v-on:click="e.recordshown = !e.recordshown, $forceUpdate()">
                    <h1>{{ e.title }}</h1>
                  </div>
                  <div class="record-body" v-if="e.recordshown">
                    <!-- MISCELLANEOUS -->
                    <div v-for="name in ['Inbox', 'History', 'Procedure', 'Management']"
                      v-if="e.data[name.toLowerCase()] !== undefined
                         && e.data[name.toLowerCase()].items.length > 0">
                      <hr><h2> {{ name }} </h2><hr>
                      <div v-for="item in e.data[name.toLowerCase()].items" v-if="item.body">
                        <p class="inherit-text" v-if="item.title"><b>{{ item.title }}</b><br></p>
                        <div
                            class="inherit-text"
                            v-if="item.body"
                            v-bind:style="{ 'font-family': 'cmu-serif' }"
                            v-html="item.body"></div>
                      </div>
                    </div>

                    <div v-if="e.data.physical.data.body || e.data.physical.sign.length">
                      <hr><h2> Physical </h2><hr>
                      <div>
                        <p><b> Vital Signs </b></p>
                        <div class="ph-3">
                          <table style="width:60%">
                            <tr v-for='item in e.data.physical.sign'>
                              <td class=" ph-1"><b>{{ item.name }}</b></td>
                              <td class="value text-left" v-html="`${item.value} ${item.units}`"></td>
                            </tr>
                          </table>
                        </div>
                        <br>
                      </div>
                      <div v-if="e.data.physical.data.title">
                        <b>{{ e.data.physical.data.title }}</b><br><br>
                      </div>
                      <div v-if="e.data.physical.data.body" v-html="e.data.physical.data.body"></div>
                    </div>
                    <div v-if="e.data.investigate.data.length || e.data.investigate.results.length">
                      <hr><h2> Investigate </h2><hr>
                      <div
                          v-for="r in e.data.investigate.results"
                          v-if="e.data.investigate.results.length">
                        <p><b>{{ r.title }}</b></p>
                        <div class="ph-3">
                          <table style="width:100%">
                            <tr>
                              <th class="text-left v-top ph-1"> Test </th>
                              <th class="text-left v-top value"> Result </th>
                              <th class="text-left v-top value"> Normal Range </th>
                            </tr>
                            <tr v-for='item in r.data'>
                              <td class="v-top ph-1"><b>{{ item.name }}</b></td>
                              <td class="v-top text-left value" v-html="`${item.value} ${item.units}`"></td>
                              <td class="v-top text-left value" v-html="`${item.range} ${item.units}`"></td>
                            </tr>
                          </table>
                        </div>
                      </div>
                      <div v-if="e.data.investigate.data.length" v-for="d in e.data.investigate.data">
                        <div v-if="d.title"><b> {{ d.title }} </b><br></div>
                        <div v-if="d.data" v-html="d.data"></div>
                      </div>
                    </div>
                    <br><br>
                  </div>
                </div>
              </div>
              <!-- PROBLEM LIST -->
              <div v-if="active==='problemlist'">
                <table style="width:100%">
                  <tr>
                    <td style="width:25%"><b>Name</b></td>
                    <td style="width:25%"><b>Start</b></td>
                    <td style="width:25%"><b>End</b></td>
                  </tr>
                  <tr v-for="item of app.problemlist()" v-if="item.start <= event || item.start === undefined">
                    <td><b>{{ item.name }}</b></td>
                    <td>{{ item.start === undefined ? '' : p.event[item.start].title }}</td>
                    <td>{{ item.end === undefined || item.end > event ? '' : p.event[item.end].title }}</td>
                  </tr>
                </table>
              </div>
              <!-- DRUG HISTORY -->
              <div v-if="active==='druglist'">
                <table style="width:100%">
                  <tr>
                    <td style="width:25%"><b>Name</b></td>
                    <td style="width:25%"><b>Dose</b></td>
                    <td style="width:25%"><b>Start</b></td>
                    <td style="width:25%"><b>End</b></td>
                  </tr>
                  <tr v-for="item of app.druglist()" v-if="item.start <= event || item.start === undefined">
                    <td><b>{{ item.name }}</b></td>
                    <td>{{ item.dose }}</td>
                    <td>{{ item.start === undefined ? '' : p.event[item.start].title }}</td>
                    <td>{{ item.end === undefined || item.end > event ? '' : p.event[item.end].title }}</td>
                  </tr>
                </table>
              </div>
              <!-- CHARTS -->
              <div v-if="active==='charts'">
                <div
                  v-for="[key, values] in app.charts()">
                  <div> <h3>{{ values[0].name }}</h3> </div>
                  <div v-bind:id="`charts-${key}`"></div>
                </div>
              </div>

              <!-- STUDY GUIDES -->
              <div v-if="active==='studyguide'">
                <div v-for="(g, indg) in e.data.guidelist">

                  <div
                    class="record-title"
                    v-on:click="g.recordshown = (g.answershown=false, !g.recordshown), $forceUpdate()">
                    <h4> {{ g.questionindex ? `Question : ${g.questionindex}` : "Study Guide" }} </h4>
                  </div>

                  <div class="record-body" v-if="g.recordshown">
                    <div v-if="g.title"><br><b>{{ g.title }}</b><br></div>
                    <div v-if="g.name=='openquestion'">
                      <div 
                        style="margin-top: 1em; margin-bottom: 1em;" 
                        v-if="g.type=='text'"> {{ g.questiontext }} </div>
                      <div v-if="g.type=='cdata'" v-html="g.questiontext">
                        {{ app.log(g) }}
                      </div>
                      <textarea width="100%"></textarea>
                      <br><br>
                      <button
                        v-if="!g.answershown"
                        v-on:click="g.answershown = true, $forceUpdate()">
                        Submit
                      </button>
                      <div v-if="g.answershown" v-html="g.responsetext"></div>
                      <br><br>
                    </div>

                    <div v-if="g.name=='data'" v-html="g.cdata"> {{ app.log(g), app.log(p) }}</div>
                  </div>


                </div>
              </div>


            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
