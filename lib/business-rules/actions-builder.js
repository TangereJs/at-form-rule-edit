(function(reNamespace, Polymer) {
  'use strict';

  reNamespace.actionsBuilder = function(options) {
    var builder = new ActionsBuilder(this, options);
    return builder;
  };

  function ActionsBuilder(element, options) {
    //this.element = element;
    this.options = options || {
      fields: []
    };
    this.init();
  }

  ActionsBuilder.prototype = {
    init: function() {
      this.fields = this.options.fields;
      this.fields.unshift({
        label: "Choose an Action...",
        name: ""
      });
      this.data = this.options.data || [];

      this._initEventsObject();
    },

    /*
      This is infrastructure for microevents
      private function _initEventsObject - initializes the event object store
      public function on - attaches an eventHandler to the desired event
      public function off - detaches an eventHandler from the desired event
      private function _triggerEvent - triggers the desired event with given event data
     */

    _initEventsObject: function() {
      // eventObjectStore for each event holds an array of function pointers (which are event handlers)
      // currently the only supported and needed event is update
      this.eventObjectStore = {
        update: []
      };
    },

    on: function(eventName, eventHandler) {
      if (this.eventObjectStore.hasOwnProperty(eventName)) {
        this.eventObjectStore[eventName].push(eventHandler);
      }
    },

    off: function(eventName, eventHandler) {
      if (this.eventObjectStore.hasOwnProperty(eventName)) {
        if (this.eventObjectStore[eventName].indexOf(eventHandler) !== -1) {
          this.eventObjectStore[eventName].remove(eventHandler);
        }
      }
    },

    _triggerEvent: function(eventName, eventData) {
      var event, handlerIndex, handlerArray, eventHandler;
      if (this.eventObjectStore.hasOwnProperty(eventName)) {
        handlerArray = this.eventObjectStore[eventName];
        if (handlerArray.length && handlerArray.length > 0) {
          event = {
            type: eventName,
            detail: eventData
          };
          for (handlerIndex = 0; handlerIndex < handlerArray.length; handlerIndex += 1) {
            eventHandler = handlerArray[handlerIndex];
            eventHandler.apply(this, event);
          }
        }
      }
    },

    setActions: function(actions) {
      this.fields = actions;
    },

    setData: function(data) {
      this.data = data;
    },

    buildActionsHtml: function() {
      var actionsHtml = this.buildActions(this.data);
      return actionsHtml;
    },

    buildActions: function(data) {
      var container = document.createElement("div");
      container.classList.add("actions");
      var self = this;
      container.addEventListener('change', function(event) {
        // trigger the update event
        self._triggerEvent('update', {});
      });

      var buttons = document.createElement("div");
      buttons.classList.add("action-buttons");
      var addButton = document.createElement("button");
      //      addButton.href = "#";
      addButton.classList.add("add");
      //      addButton.textContent = "Add Action";
      var addButtonText = document.createTextNode("Add Action");
      addButton.appendChild(addButtonText);
      var _this = this;

      addButton.addEventListener('click', function(e) {
        e.preventDefault();
        Polymer.dom(container).appendChild(_this.buildAction({}));

        // trigger the update event
        self._triggerEvent('update', {});
      });

      buttons.appendChild(addButton);
      container.appendChild(buttons);

      for (var i = 0; i < data.length; i++) {
        var actionObj = data[i];
        actionObj.name = 'action-select';
        var actionDiv = this.buildAction(actionObj);
        var j, k;
        // Add values to fields
        var fields = [actionObj];
        var field;
        while (field = fields.shift()) {
          var selector = "*[name='" + field.name + "']";
          var findResult = Polymer.dom(actionDiv).querySelectorAll(selector);
          for (j = 0; j < findResult.length; j += 1) {
            var result = findResult[j];
            result.value = field.value;
          }
          for (k = 0; k < findResult.length; k += 1) {
            var result = findResult[k];
            //      var changeEvent = new Event('change'); // <- this doesn't work in IE11
            var changeEvent = document.createEvent('HTMLEvents');
            changeEvent.initEvent('change', false, true);
            result.dispatchEvent(changeEvent);
          }

          if (field.fields) {
            fields = fields.concat(field.fields);
          }
        }
        container.appendChild(actionDiv);
      }
      return container;
    },

    buildAction: function(data) {
      var field = this._findField(data.name);
      var div = document.createElement("div");
      div.classList.add("action");
      var fieldsDiv = document.createElement("div");
      fieldsDiv.classList.add("subfields");
      var select = document.createElement("select");
      select.classList.add("action-select");
      select.name = "action-select";

      for (var i = 0; i < this.fields.length; i++) {
        var possibleField = this.fields[i];
        var option = document.createElement("option");
        option.textContent = possibleField.label;
        option.value = possibleField.name;
        select.appendChild(option);
      }

      var _this = this;
      select.addEventListener('change', function() {
        var val = this.value;
        var newField = _this._findField(val);
        fieldsDiv.innerHTML = '';

        if (newField.fields) {
          for (var j = 0; j < newField.fields.length; j++) {
            var currentField = newField.fields[j];
            var builtField = _this.buildField(currentField);
            Polymer.dom(fieldsDiv).appendChild(builtField);
          }
        }

        div.classList.add("action");
        if (val !== "") {
          div.classList.add(val);
        }
      });

      //      var changeEvent = new Event('change'); // <- this doesn't work in IE11
      var changeEvent = document.createEvent('HTMLEvents');
      changeEvent.initEvent('change', false, true);
      select.dispatchEvent(changeEvent);

      var removeLink = document.createElement("button");
      removeLink.classList.add("remove");
      //      removeLink.href = "#";
      var removeLinkText = document.createTextNode("Remove Action");
      removeLink.appendChild(removeLinkText);
      //      removeLink.textContent = "Remove Action";

      var self = this;

      removeLink.addEventListener('click', function(e) {
        e.preventDefault();
        Polymer.dom(div.parentElement).removeChild(div);

        // trigger the update event
        self._triggerEvent('update', {});
      });

      div.appendChild(select);
      div.appendChild(fieldsDiv);
      div.appendChild(removeLink);
      return div;
    },

    buildField: function(field) {
      var div = document.createElement("div");
      div.classList.add("field");
      var subfields = document.createElement("div");
      subfields.classList.add("subfields");
      var _this = this;

      var label = document.createElement("label");
      label.textContent = field.label;
      div.appendChild(label);

      if (field.fieldType == "select") {
        var label = document.createElement("label");
        label.textContent = field.label;
        var select = document.createElement("select");
        select.name = field.name;

        for (var i = 0; i < field.options.length; i++) {
          var optionData = field.options[i];
          var option = createSelectOption(optionData.name, optionData.label, false);
          option.setAttribute('optionData', JSON.stringify(optionData));
          select.appendChild(option);
          if (i === 0) {
            select.value = option.value;
          }
        }

        select.addEventListener('change', function() {
          var option = Polymer.dom(this).querySelector("option:checked");
          if (option) {
            var optionData = option.attributes.getNamedItem("optionData").value;
            var optionData = JSON.parse(optionData);
            subfields.innerHTML = "";
            if (optionData.fields) {
              for (var i = 0; i < optionData.fields.length; i++) {
                var f = optionData.fields[i];
                Polymer.dom(subfields).appendChild(_this.buildField(f));
              }
            }
          }
        });

        div.appendChild(select);

        var changeEvent = document.createEvent("Event");
        changeEvent.initEvent('change', true, true);
        select.dispatchEvent(changeEvent);
      } else if (field.fieldType == "text") {
        var input = document.createElement("input");
        input.type = "text";
        input.name = field.name;
        div.appendChild(input);
      } else if (field.fieldType == "textarea") {
        var id = "textarea-" + Math.floor(Math.random() * 100000);
        var area = document.createElement("textarea");
        area.name = field.name;
        area.id = id;
        div.appendChild(area);
      }

      if (field.hint) {
        var pElem = document.createElement("p");
        pElem.classList.add("hint");
        pElem.textContent = field.hint;
        div.append(pElem);
      }

      div.appendChild(subfields);
      return div;
    },

    collectData: function(fields, actionsHtml) {
      var _this = this;
      fields = fields || Polymer.dom(actionsHtml).querySelectorAll(".action");
      var out = [];
      if (fields.length > 0) {
        for (var p = 0; p < fields.length; p++) {
          var field = fields[p];
          //var input = field.find("> :input, > .jstEditor > :input");
          var input = selectInputs(field); //$(this).find("> :input, > .jstEditor > :input");
          input = input.length !== undefined && input.length > 0 ? input[0] : input;
          var subfields = Polymer.dom(field).querySelectorAll(".subfields > .field");
          var action = {
            name: input.name,
            value: input.value
          };
          if (subfields.length > 0) {
            action.fields = _this.collectData(subfields);
          }
          out.push(action);
        }
      }
      return out;
    },

    _findField: function(fieldName) {
      for (var i = 0; i < this.fields.length; i++) {
        var field = this.fields[i];
        if (field.name == fieldName) return field;
      }
    }
  };

  function selectInputs(field) {
    // objective of this function is to simulate this
    //var input = field.find("> :input, > .jstEditor > :input");
    var result1 = selectSelectTextAreaOrInput(field);
    var result2 = Polymer.dom(field).querySelector(".jstEditor");
    var result3 = result2 !== null ? selectSelectTextAreaOrInput(result2) : undefined;
    return result1 || result3;
  }

  function selectSelectTextAreaOrInput(field) {
    var results = [];
    var tmpResults = Polymer.dom(field).querySelectorAll("select");
    if (tmpResults !== undefined && tmpResults.length > 0) {
      for (var i = 0; i < tmpResults.length; i++) {
        results.push(tmpResults[i]);
      }
    }

    var tmpResults = Polymer.dom(field).querySelectorAll("input");
    if (tmpResults !== undefined && tmpResults.length > 0) {
      for (var i = 0; i < tmpResults.length; i++) {
        results.push(tmpResults[i]);
      }
    }

    var tmpResults = Polymer.dom(field).querySelectorAll("textarea");
    if (tmpResults !== undefined && tmpResults.length > 0) {
      for (var i = 0; i < tmpResults.length; i++) {
        results.push(tmpResults[i]);
      }
    }
    return results;
  }

  function createSelectOption(value, text, selected) {
    var option = document.createElement("option");
    option.value = value;
    option.text = text;
    //if (selected) {
    //  option.setAttribute('checked', null);
    //}

    return option;
  }

})(window.RuleEngineHelpers = window.RuleEngineHelpers || {}, window.Polymer);
