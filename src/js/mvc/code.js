app.CodeView = app.Pane.extend({
  el: "#code",

  events: {
    "change select": "setSyntax",
    "click .fork": "fork",
    "click .raw": "raw",
    "click .edit": "edit",
    "click .save": "save",
    "click .cancel": "render",
    "click .remove": "askRemove"
  },

  setModel: function(model) {
    app.connection.off('broadcast:change');
    if (!model.isOwn()) {
      var _this = this;
      app.connection.on('broadcast:change', function(args) {
        if (args.id === model.get('id') && args.name === model.get('name')) {
          _this.model.set(args.changes);
          _this.render();
        }
      });
    }
    this.model = model;
    return this;
  },

  renderText: function() {
    this.$("pre").code(this.model);
  },

  render: function() {
    this.$el.html( app.jst.codeView({m: this.model}) );
    this.renderText();

    // If own paste, then make the title editable and allow
    // for selecting syntax
    if ( this.model.isOwn() ) {
      var _this = this;
      this.$('.title').editable(function(title) {
        _this.model.set('title', title);
        _this.broadcastChange();
      });

      // Syntax select
      this.$('.syntax').html(app.jst.syntaxView({m: this.model}));
    }

    return this;
  },

  setSyntax: function() {
    this.model.set('syntax', this.$("select").val());
    this.broadcastChange();
    this.render();
  },

  fork: function(e) {
    e.stopPropagation();
    var json = this.model.toJSON();
    delete json.id;
    delete json.created;
    delete json.name;
    var paste = new app.PasteModel(json);
    app.pasteCollection.add(paste);
    app.router.navigate(paste.url(), {trigger: true});
  },

  raw: function(e) {
    e.stopPropagation();
    if ( !this.rawDisplay ) {
      var text = this.model.get('text');
      this.$('pre').text(text);
      this.rawDisplay = true;
    } else {
      this.renderText();
      this.rawDisplay = false;
    }
  },

  edit: function(e) {
    e.stopPropagation();
    this.$(".content").html(app.jst.editCodeView({m: this.model}));
    this.$("textarea").focus();
  },

  save: function() {
    this.model.set('text', this.$('textarea').val());
    this.broadcastChange();
    this.render();
  },

  askRemove: function() {
    var _this = this;
    app.confirm({
      el: this.$('.remove'),
      message: "",
      onYes: function() {
        app.pasteCollection.remove(_this.model);
        app.router.navigate('list', {trigger: true});
      }
    });
  },

  broadcastChange: function() {
    var model = this.model.toJSON();
    app.connection.send('broadcast', {
      action: 'change',
      id: model.id,
      name: app.identity(),
      changes: _(model).pick('title', 'syntax', 'text')
    });
  }

});
