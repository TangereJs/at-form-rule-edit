(function (reNamespace, $) {
  reNamespace.conditionsBuilder = function (options) {
    var builder = new ConditionsBuilder(this, options);
    return builder;
  };

  function ConditionsBuilder(element, options) {
    //this.element = element;
    this.options = options || {};
    this.init();
  }

  ConditionsBuilder.prototype = {
    init: function () {
      this.fields = this.options.fields;
      this.data = this.options.data || { "all": [] };
      //this.element.conditionsHtml = conditionsHtml;
    },

    buildConditionsHtml: function () {
      var conditionsHtml = this.buildConditions(this.data);
      return conditionsHtml;
    },

    collectData: function (conditionsHtml) {
      //.querySelectorAll(".conditional")
      return this.collectDataFromNode(conditionsHtml);
    },

    collectDataFromNode: function (element) {
      var klass = null;
      var _this = this;

      if (element.classList.contains("conditional")) {
        klass = element.querySelector(".all-any-none-wrapper > .all-any-none").value;
        //klass = element.find("> .all-any-none-wrapper > .all-any-none").val();
      }

      if (klass) {
        var out = {};
        out[klass] = [];
        var rules = element.querySelectorAll(".conditional > .rule");
        if (rules.length > 0) {
          for (var k = 0; k < rules.length; k += 1) {
            out[klass].push(_this.collectDataFromNode(rules[k]));
          }
        }
        //element.find("> .conditional, > .rule").each(function() {});
        return out;
      }
      else {
        var values = element.querySelectorAll(".value");
        var lastValue = values[values.length - 1];
        return {
          name: element.querySelector(".field").value,
          operator: element.querySelector(".operator").value,
          value: lastValue.value,
          isFieldComparison: values.length > 1 && values[0].value === 'field'
        };
      }
    },

    buildRules: function (ruleData) {
      var conds = this.buildConditional(ruleData);
      var rules = this.buildRule(ruleData);
      return conds || rules;
    },

    buildConditions: function (ruleData) {
      var kind;
      if (ruleData.all) { kind = "all"; }
      else if (ruleData.any) { kind = "any"; }
      else if (ruleData.none) { kind = "none"; }
      if (!kind) { return; }

      var div = document.createElement("div");
      div.classList.add("conditional");
      div.classList.add(kind);

      var selectWrapper = document.createElement("div");
      selectWrapper.classList.add("all-any-none-wrapper");

      var select = document.createElement("select");
      select.classList.add("all-any-none");

      var option = createSelectOption("all", "All", kind === "all");
      select.appendChild(option);
      option = createSelectOption("any", "Any", kind === "any");
      select.appendChild(option);
      option = createSelectOption("none", "None", kind === "none");
      select.appendChild(option);
      selectWrapper.appendChild(select);

      var span = document.createElement("span");
      span.textContent = "of the following rules:";
      selectWrapper.appendChild(span);
      div.appendChild(selectWrapper);

      var addRuleLink = document.createElement("a");
      addRuleLink.href = "#";
      addRuleLink.classList.add("add-rule");
      addRuleLink.text = "Add Rule";
      var _this = this;
      addRuleLink.addEventListener('click', function (e) {
        e.preventDefault();
        var f = _this.fields[0];
        var newField = { name: f.value, operator: f.operators[0], value: null };
        div.appendChild(_this.buildRule(newField));
      });
      div.appendChild(addRuleLink);

      var addConditionLink = document.createElement("a");
      addConditionLink.href = "#";
      addConditionLink.classList.add("add-condition");
      addConditionLink.text = "Add Sub-Condition";
      addConditionLink.addEventListener('click', function (e) {
        e.preventDefault();
        var f = _this.fields[0];
        var newField = { "all": [{ name: f.value, operator: f.operators[0], value: null }] };
        div.appendChild(_this.buildConditions(newField));
      });
      div.appendChild(addConditionLink);

      var removeLink = document.createElement("a");
      removeLink.href = "#";
      removeLink.classList.add("remove");
      removeLink.text = "Remove This Sub-Condition";
      removeLink.addEventListener('click', function (e) {
        e.preventDefault();
        div.remove();
      });
      div.appendChild(removeLink);

      var rules = ruleData[kind];
      for (var i = 0; i < rules.length; i++) {
        var ruleHtml = this.buildRule(rules[i]);
        div.appendChild(ruleHtml);
      }

      return div;
    },

    buildRule: function (ruleData) {
      var ruleDiv = document.createElement("div");
      ruleDiv.classList.add("rule");
      var fieldSelect = getFieldSelect(this.fields, ruleData);
      var operatorSelect = getOperatorSelect();
      var _builder = this;
      fieldSelect.addEventListener('change', function (e) {
        var fieldName = e.target.value;
        var fieldRuleData = _builder.GetRuleDataFor(fieldName);
        var operators = _builder.operatorsFor(fieldName);
        operatorSelect.innerHTML = "";
        if (operators !== undefined) {
          for (var i = 0; i < operators.length; i++) {
            var operator = operators[i];
            var option = createSelectOption(operator.name, operator.label || operator.name, fieldRuleData.operator == operator.name);
            var fieldTypeAttr = document.createAttribute("data-fieldType");
            fieldTypeAttr.value = operator.fieldType;
            option.attributes.setNamedItem(fieldTypeAttr);
            operatorSelect.appendChild(option);
          }
        }
        var event = new Event("change");
        operatorSelect.dispatchEvent(event);
      });

      ruleDiv.appendChild(fieldSelect);
      ruleDiv.appendChild(operatorSelect);
      ruleDiv.appendChild(removeLink());

      var event = new Event("change");
      fieldSelect.dispatchEvent(event);
      var classValueElems = ruleDiv.querySelectorAll(".value");
      for (var j = 0; j < classValueElems.length; j++) {
        var cvElem = classValueElems[j];
        cvElem.value = ruleData.value;
      }

      return ruleDiv;
    },

    operatorsFor: function (fieldName) {
      for (var i = 0; i < this.fields.length; i++) {
        var field = this.fields[i];
        if (field.name == fieldName) {
          return field.operators;
        }
      }
    },

    GetRuleDataFor: function (fieldName) {
      var kind;
      if (this.data.all) { kind = "all"; }
      else if (this.data.any) { kind = "any"; }
      else if (this.data.none) { kind = "none"; }
      if (kind) {
        var rules = this.data[kind];

        for (var i = 0; i < rules.length; i += 1) {
          if (rules[i].name === fieldName) { return rules[i]; }
        }
      }

      return { name: fieldName, operator: '', value: '' };
    }
  };

  function createSelectOption(value, text, selected) {
    var option = document.createElement("option");
    option.value = value;
    option.text = text;
    option.selected = selected;

    return option;
  }

  function getFieldSelect(fields, ruleData) {
    var select = document.createElement("select");
    select.classList.add("field");
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var option = createSelectOption(field.name, field.label, ruleData.name === field.name);
      option.dataset.options = JSON.stringify(field.options);
      select.appendChild(option);
    }

    return select;
  }

  function getOperatorSelect() {
    var select = document.createElement("select");
    select.classList.add("operator");
    select.addEventListener('change', onOperatorSelectChange);
    return select;
  }

  function removeLink() {
    var removeLink = document.createElement("a");
    removeLink.classList.add("remove");
    removeLink.href = "#";
    removeLink.text = "Remove";
    removeLink.addEventListener('click', onRemoveLinkClicked);
    return removeLink;
  }

  function onRemoveLinkClicked(e) {
    e.preventDefault();
    this.parentElement.remove();
  }

  function onOperatorSelectChange(e) {
    var option = this.querySelector("option:checked");
    if (option !== undefined) {
      var container = option.parentElement.parentElement;
      var fieldSelect = container.querySelector(".field");
      var currentValue = container.querySelectorAll(".value");
      var fieldType = option.attributes.getNamedItem("data-fieldType").value;
      switch (fieldType) {
        case "none":
          var nElem = document.createElement("input");
          nElem.type = "hidden";
          nElem.classList.add("value");
          container.appendChild(nElem);
          break;
        case "text":
          nElem = document.createElement("input");
          nElem.type = "text";
          nElem.classList.add("value");
          container.appendChild(nElem);
          break;
        case "textarea":
          nElem = document.createElement("textarea");
          nElem.classList.add("value");
          container.appendChild(nElem);
          break;
        case "select":
          nElem = document.createElement("select");
          nElem.classList.add("value");
          var options = fieldSelect.querySelector("option:checked").attributes.getNamedItem("data-options").value;
          options = JSON.parse(options);
          for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var htmlOption = createSelectOption(opt.name, opt.label || opt.name, false);
            htmlOption.setAttribute('fieldType', opt.fieldType);
            htmlOption.setAttribute('options', JSON.stringify(opt.options));
            nElem.appendChild(htmlOption);
          }
          container.appendChild(nElem);

          nElem.addEventListener('change', function (e) {
            var type = e.target.value;
            // remove the previous item
            var nextSibling = e.target.nextElementSibling;
            if (nextSibling !== null && nextSibling.classList.contains('remove') === false) { nextSibling.remove(); }
            switch (type) {
              case 'static':
                var option = e.target.querySelector('option[value="static"]');
                var optionType = option.getAttribute('fieldType');
                var optionOptions = option.getAttribute('options') !== "undefined" ? option.getAttribute('options') : "{}";
                var optionData = JSON.parse(optionOptions);
                var input = undefined;
                if (optionType === 'select') {
                  // create select here
                  input = document.createElement('select');
                  input.classList.add('value');
                  for (var i = 0; i < optionData.length; i++) {
                    var selectOption = createSelectOption(optionData[i].name, optionData[i].label, false);
                    input.appendChild(selectOption);
                  }
                } else {
                  // create text input here
                  input = document.createElement('input');
                  input.setAttribute('type', 'text');
                  input.classList.add('value');
                }
                var refElement = e.target.parentElement.lastChild === e.target ? null : e.target.parentElement.lastChild;
                e.target.parentElement.insertBefore(input, refElement);
                break;
              case 'field':
                var option = e.target.querySelector('option[value="field"]');
                var optionOptions = option.getAttribute('options') !== "undefined" ? option.getAttribute('options') : "{}";
                var optionData = JSON.parse(optionOptions);

                // create select here
                var selectInput = document.createElement('select');
                selectInput.classList.add('value');
                for (var i = 0; i < optionData.length; i++) {
                  var selectOption = createSelectOption(optionData[i].name, optionData[i].label, false);
                  selectInput.appendChild(selectOption);
                }
                var refElement = e.target.parentElement.lastChild === e.target ? null : e.target.parentElement.lastChild;
                e.target.parentElement.insertBefore(selectInput, refElement);
                break;
              default:
                break;
            }
          });
          var changeEvent = document.createEvent('Event');
          changeEvent.initEvent('change', true, true);
          nElem.dispatchEvent(changeEvent);
          break;
        case "rule":
          debugger;
          break;
      }
      var removeLink = container.getElementsByTagName("a")[0];
      removeLink.remove();
      container.appendChild(removeLink);
      if (currentValue !== undefined) {
        for (var k = 0; k < currentValue.length; k++) {
          currentValue[k].remove();
        }
      }
    }
  }

})(window.RuleEngineHelpers = window.RuleEngineHelpers || {}, window.jQuery);
