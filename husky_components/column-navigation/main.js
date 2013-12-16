/**
 * This file is part of Husky frontend development framework.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 *
 * @module husky/components/column-navigation
 */

// TODO
// browser compatibility testing (scrollbar position and width);

/**
 * @class ColumnNavigation
 * @constructor
 *
 * @params {Object} [options] Configuration object
 * @params {Number} [options.wrapper.height] height of container
 * @params {Number} [options.column.width] width of a column in within the navigation
 * @params {Number} [options.scrollBarWidth] with of scrollbar
 * @params {url} [options.url] url to load data
 *
 */
define([], function() {

    'use strict';

    var defaults = {
            wrapper: {
                height: 300
            },
            column: {
                width: 250
            },
            url: null
        },

        SCROLLBARWIDTH = 15, // width of scrollbars
        DISPLAYEDCOLUMNS = 3, // number of displayed columns

        eventNamespace = 'husky.column-navigation.',

        /**
         * @event husky.column-navigation.loaded
         * @description the component has loaded everything successfully and will be rendered
         */
        LOADED = eventNamespace + 'loaded',

        /**
         * @event husky.column-navigation.selected
         * @description an navigation element has been selected
         * @param {Object} selected object
         */
        SELECTED = eventNamespace + 'selected',

        /**
         * @event husky.column-navigation.add
         * @description the add button has been clicked
         * @param {Object} parent object from active column level
         */
        ADD = eventNamespace + 'add',

        /**
         * @event husky.column-navigation.edit
         * @description the edit icon has been clicked
         * @param {Object} clicked object
         */
        EDIT = eventNamespace + 'edit',

        /**
         * @event husky.column-navigation.settings
         * @description the settings button has been clicked
         * @param {Object} parent object from active column level
         */
        SETTINGS = eventNamespace + 'settings',

        /**
         * @event husky.column-navigation.get-breadcrumb
         * @description the breadcrumb will be returned
         * @param {Function} callback function which will process the breadcrumb objects
         */
        BREADCRUMB = eventNamespace + 'get-breadcrumb';

    return {

        initialize: function() {

            this.options = this.sandbox.util.extend(true, {}, defaults, this.options);
            this.$element = this.sandbox.dom.$(this.options.el);

            this.containerWidth = this.sandbox.dom.width(this.$element);
            this.columns = [];
            this.selected = [];

            this.render();
            this.load(this.options.url, 0);
            this.bindDOMEvents();
            this.bindCustomEvents();

        },

        /**
         * Renders basic structure (wrapper) of column navigation
         */
        render: function() {
            var $add, $settings, $wrapper;

            $wrapper = this.sandbox.dom.$(this.template.wrapper());
            this.sandbox.dom.append(this.$element, $wrapper);

            // navigation container
            this.$columnContainer = this.sandbox.dom.$(this.template.columnContainer(this.options.wrapper.height + SCROLLBARWIDTH));
            this.sandbox.dom.append($wrapper, this.$columnContainer);

            // options container - add and settings button
            this.$optionsContainer = this.sandbox.dom.$(this.template.optionsContainer(this.options.column.width));
            $add = this.sandbox.dom.$(this.template.options.add());
            $settings = this.sandbox.dom.$(this.template.options.settings());
            this.sandbox.dom.append(this.$optionsContainer, $add);
            this.sandbox.dom.append(this.$optionsContainer, $settings);

            this.sandbox.dom.append($wrapper, this.$optionsContainer);
        },

        /**
         * Loads data from a specific url and triggers the parsing
         * @param {String} url
         * @param {Number} columnNumber
         */
        load: function(url, columnNumber) {

            if (!!url) {

                this.sandbox.util.ajax({

                    url: url,

                    error: function(jqXHR, textStatus, errorThrown) {
                        this.sandbox.logger.log("An error occured while fetching data from: " + this.options.url);
                        this.sandbox.logger.log("errorthrown", errorThrown.message);
                    }.bind(this),

                    success: function(response) {

                        this.parseData(response, columnNumber);
                        this.sandbox.emit(LOADED);

                    }.bind(this)
                });
            } else {
                this.sandbox.logger.log("husky.column.navigation -  url not set, aborted loading of data");
            }
        },

        /**
         * Removes removes data and removes dom elements
         * @param {Number} newColumn
         */
        removeColumns: function(newColumn) {

            var length = this.columns.length - 1,
                i;

            for (i = length; i >= newColumn; i--) {
                delete this.columns[i];
                this.sandbox.dom.remove('#column-' + i);
            }
        },

        /**
         * Parses the received data and renders columns
         * @param {String} data
         * @param {Number} columnNumber
         */
        parseData: function(data, columnNumber) {
            var $column,
                $list,
                newColumn;

            this.data = {};
            this.data.links = data._links;
            this.data.embedded = data._embedded;
            this.data.title = data.title;
            this.data.id = data.id;
            this.data.hasSub = data.hasSub;

            if (columnNumber === 0) {  // case 1: no elements in container
                this.columns[0] = [];
                this.columns[0][data.id] = data;
                newColumn = 1;
            } else { // case 2: columns in container replace level after clicked column and clear following levels
                newColumn = columnNumber + 1;
            }


            $column = this.sandbox.dom.$(this.template.column(newColumn, this.options.wrapper.height));
            $list = this.sandbox.dom.find('ul', $column);

            this.sandbox.util.each(this.data.embedded, function(index, value) {
                this.storeDataItem(newColumn, value);
                this.sandbox.dom.append($list, this.sandbox.dom.$(this.template.item(this.options.column.width - SCROLLBARWIDTH, value)));
            }.bind(this));

            this.sandbox.dom.append(this.$columnContainer, $column);

            if(newColumn > DISPLAYEDCOLUMNS){
                // scroll one column to the right
                this.sandbox.dom.scrollLeft(this.$columnContainer, this.options.column.width);
            }
        },

        /**
         * Stores data in internal structure - seperated by column number
         * @param {Object} item
         * @param {Number} columnNumber
         */
        storeDataItem: function(columnNumber, item) {

            if (!this.columns[columnNumber]) {
                this.columns[columnNumber] = [];
            }
            this.columns[columnNumber][item.id] = item;

        },


        bindDOMEvents: function() {
            this.sandbox.dom.on(this.$el, 'click', this.itemSelected.bind(this), 'li');

            this.sandbox.dom.on(this.$el, 'mouseenter', this.itemMouseEnter.bind(this), 'li');
            this.sandbox.dom.on(this.$el, 'mouseleave', this.itemMouseLeave.bind(this), 'li');

            this.sandbox.dom.on(this.$el, 'mouseenter', this.showOptions.bind(this), '.column');
            this.sandbox.dom.on(this.$el, 'click', this.addNode.bind(this), '#column-navigation-add');
            this.sandbox.dom.on(this.$el, 'click', this.toggleSettings.bind(this), '#column-navigation-settings');
            this.sandbox.dom.on(this.$el, 'click', this.editNode.bind(this), '.edit');
        },

        bindCustomEvents: function(){
            this.sandbox.on(BREADCRUMB, this.getBreadCrumb.bind(this));
        },

        /**
         * Shows the edit icon
         * @param {Object} event
         */
        itemMouseEnter: function(event){
            var $edit = this.sandbox.dom.find('.edit', event.currentTarget);
            this.sandbox.dom.toggle($edit);
        },

        /**
         * Hides the edit icon
         * @param {Object} event
         */
        itemMouseLeave: function(event){
            var $edit = this.sandbox.dom.find('.edit', event.currentTarget);
            this.sandbox.dom.toggle($edit);
        },

        /**
         * Returns the breadcrumb
         * @param {Function} callback
         */
        getBreadCrumb: function(callback){
            if(typeof callback === 'function') {
                callback(this.selected);
            } else {
                this.sandbox.logger.log("callback is not a function");
            }
        },

        /**
         * Shows the options below the last hovered column
         * @param {Object} event
         */
        showOptions: function(event) {

            this.sandbox.dom.one(this.$columnContainer, 'scroll', this.hideOptions.bind(this));

            this.lastHoveredColumn = this.sandbox.dom.data(this.sandbox.dom.$(event.currentTarget), 'column');

            var scrollPositionX =  this.sandbox.dom.scrollLeft(this.sandbox.dom.parent(event.currentTarget)),
                marginLeft = ((this.lastHoveredColumn - 1) * this.options.column.width);

            if(scrollPositionX > 0) { // correct difference through scrolling
                marginLeft -= scrollPositionX;
            }

            this.sandbox.dom.show(this.$optionsContainer);
            this.sandbox.dom.css(this.$optionsContainer, 'margin-left',  marginLeft+ 'px');


        },

        /**
         * Hides options
         */
        hideOptions: function() {
            this.sandbox.dom.hide(this.$optionsContainer);
        },

        /**
         * Item was selected and data will be loaded if has sub
         * @param {Object} event
         */
        itemSelected: function(event) {

            var $target = this.sandbox.dom.$(event.currentTarget),
                id = this.sandbox.dom.data($target, 'id'),
                column = this.sandbox.dom.data(this.sandbox.dom.parent(this.sandbox.dom.parent($target)), 'column'),
                selectedItem = this.columns[column][id],
                length = this.selected.length - 1,
                i, $arrowElement, margin;

            this.removeCurrentSelected(column);
            this.sandbox.dom.addClass($target, 'selected');
            $arrowElement = this.sandbox.dom.find('.arrow', $target);
            this.sandbox.dom.removeClass($arrowElement, 'inactive');

            // when is not scrolled and column > 3 then scroll
            if(column > DISPLAYEDCOLUMNS) {
                margin = (((column*this.options.column.width)+SCROLLBARWIDTH) - this.containerWidth);
                this.sandbox.dom.scrollLeft(this.$columnContainer, (margin > 0) ? margin : 0);
            }

            if (!!selectedItem) {

                // remove old elements from breadcrumb
                for (i = length; i >= column; i--) {
                    delete this.selected[i];
                }

                // add element to breadcrumb
                this.selected[column] = selectedItem;
                this.sandbox.emit(SELECTED, selectedItem);

                if (!!selectedItem.hasSub) {
                    this.load(selectedItem._links.children, column);
                }

                this.removeColumns(column + 1);
            }

        },

        /**
         * Removes the selected class from old elements
         * @param {Number} column
         */
        removeCurrentSelected: function(column) {
            var items = this.sandbox.dom.find('li', '#column-'+column);
            this.sandbox.util.each(items, function(index, $el){
                this.sandbox.dom.removeClass($el, 'selected');
                var $arrowElement = this.sandbox.dom.find('.arrow', $el);
                this.sandbox.dom.addClass($arrowElement, 'inactive');
            }.bind(this));
        },

        /**
         * Emits an add event
         */
        addNode: function(){
            var parent = this.selected[this.lastHoveredColumn-1] || null;
            this.sandbox.emit(ADD, parent);
        },

        /**
         * Emits an edit event
         * @param {Object} event
         */
        editNode: function(event){
            var $listItem = this.sandbox.dom.parent(this.sandbox.dom.parent(event.currentTarget)),
                id = this.sandbox.dom.data($listItem,'id'),
                item = this.columns[this.lastHoveredColumn][id];

            this.sandbox.dom.stopPropagation(event);
            this.sandbox.emit(EDIT, item);
        },

        /**
         * Shows or hides the settings dropdown
         */
        toggleSettings: function() {
            var parent = this.selected[this.lastHoveredColumn-1] || null;
            this.sandbox.emit(SETTINGS, parent);
        },

        /**
         * Templates for various parts
         */
        template : {

            wrapper : function() {
              return '<div class="column-navigation-wrapper"></div>';
            },

            columnContainer: function(height) {
                return ['<div class="column-navigation" style="height:',height,'px"></div>'].join('');
            },

            column : function (columnNumber, height, width){
                return ['<div data-column="',columnNumber,'" class="column" id="column-',columnNumber,'" style="height:',height,'px; width: ',width,'px"><ul></ul></div>'].join('');
            },

            item : function (width, data){

                var item = ['<li data-id="',data.id,'" class="pointer" style="width:',width,'px">'];

                // icons left
                item.push('<span class="pull-left">');

                // link
                if(!!data.linked) {
                    if(data.linked === 'internal') {
                        item.push('<span class="icon-internal-link pull-left m-right-5"></span>');
                    } else if(data.linked === 'external') {
                        item.push('<span class="icon-external-link pull-left m-right-5"></span>');
                    }
                }

                // type (ghost, shadow)
                if(!!data.type) {
                    if(data.type.name === 'ghost') {
                        item.push('<span class="ghost pull-left m-right-5">',data.type.value,'</span>');
                    } else if(data.type.name === 'shadow') {
                        item.push('<span class="icon-shadow-node pull-left m-right-5"></span>');
                    }
                }


                // published
                if(!data.published) {
                    item.push('<span class="not-published pull-left m-right-5">&bull;</span>');
                }

                item.push('</span>');


                // text center
                if(!!data.type && data.type.name === 'ghost') {
                    item.push('<span class="item-text inactive pull-left">',data.title,'</span>');
                } else {
                    item.push('<span class="item-text pull-left">',data.title,'</span>');
                }

                // icons right (subpage, edit)
                item.push('<span class="pull-right">');
                item.push('<span class="icon-edit-pen edit hidden"></span>');
                !!data.hasSub ? item.push('<span class="icon-chevron-right arrow inactive"></span>') : '';
                item.push('</span></li>');

                return item.join('');
            },

            optionsContainer: function(width){
                return ['<div class="options grid-row hidden" style="width:',width,'px"></div>'].join('');
            },

            options: {
                add : function (){
                    return ['<div id="column-navigation-add" class="align-center grid-col-6 add pointer">' +
                                '<span class="icon-add"></span>' +
                            '</div>'].join('');
                },

                settings : function() {
                    return ['<div id="column-navigation-settings" class="align-center grid-col-6 settings pointer">' +
                                '<span class="icon-cogwheel"></span>' +
                             '</div>'].join('');
                }
            }
        }



    };
});
