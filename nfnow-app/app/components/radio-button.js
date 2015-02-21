/* global Ember */

export default Ember.Component.extend({
    tagName : "input",
    type : "radio",
    attributeBindings : [ "name", "type", "value", "checked:checked" ],

    name: "radio-group1",
    value: null,
    selection: null,

    click : function() {
        this.set("selection", this.$().val());
    },

    checked : function() {
        return this.get("value") === this.get("selection");
    }.property('selection')
});