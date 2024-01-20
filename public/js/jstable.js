class JSETable
{
    //-- todo stockage en session

    //-- todo " no data"

    //-- add selectoptions for column with callback for eval
    /*events:
        onAfterSetData
        onPageChange
        onPageSizeChange

    */

    static defaultOptions = {
        "filterEnable": true,                     // enable/disable filters
        "sorterEnable": true,                     // enable/disable sort
        "pagerEnable": true,                      // enable/disable pager
        "exportEnable": false,                    // enable/disable export (next version)
        "debug": false,   						  // enable/disable debug
        "lignes" : null,                          // contain array of data
        "page_size" : null,                       // set default page size
        "classDivContainer": "JSEContainer",      // HTML Class for div container
        "classDivPager": "JSEPager",              // HTML Class for div pager
        "classDivPageSelect": "JSEPageSelect",    // HTML Class for div page select
        "classDivPageSize": "JSEPageSize",        // HTML Class for div page size
        "classDivExport": "JSEExport",            // HTML Class for div export
        "classDivTable": "JSETable",              // HTML Class for div table
        "classDivTop": "JSETop",                  // HTML Class for div top
        "classDivBottom": "JSEBottom",            // HTML Class for div bottom
        "classRowFilters": "JSEFilters",          // HTML Class for row with filters
        "classThSorters": "JSESorters",          // HTML Class for th for sort
        "pagerDivPosition": "top",                // Set Pager Select to Top / Bottom
        "pageSizeDivPosition": "top",             // Set Page Size Select to Top / Bottom
        "exportDivPosition": "top",               // Set Export Button to Top / Bottom

        "DivText": true,                  // Print the text
        "divTextFormat" : "{start} à {end} sur {filtered} lignes (total : {total})",
        "classDivText": "JSEText",  // HTML Class the text

        "pagerSelectPage": true,                  // Print the page selector
        "pagerSelectPageClass": "JSESelectPage",     // HTML Class the page selector
        "pagerSelectPageSize": true,
        "pagerSelectPageSizeClass": "JSESelectPageSize",
        "pagerSelectPageSizeList": [5,10,15,20,25,30,-1],
        "pagerSelectPageSizeAll": "Tous",

        "pagerBtnFirstLast": true,
        "pagerBtnClass": "JSEBtn",

        "pagerBtnFirstVal": "<<",
        "pagerBtnPrevVal":  "<",
        "pagerBtnNextVal":  ">",
        "pagerBtnLastVal":  ">>",

        "filterMultiple" : true,
        "sessionSave" : false,
    };

    static globalRenderers = {
        "number" : {
            "display" : function (data){	return "p-  " + data;},
            "sort" : function (data){	return parseFloat(data);}
        },
        "date" : {
            "sort" : function (str){
                var m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                return (m) ? ("0000" + m[3]).substr(-4) + '-' + ("00" + m[2]).substr(-2) + '-' + ("00" + m[1]).substr(-2) : null;
            }
        },
        "checkbox" : {
            "display" : function (str){ return '<input type=checkbox checked=>';
            },
            "sort" : function (str) { return str;},
            "filter" : function (str) { return str;}
        }
    };

    renderers = [];


    initialisationDone = false;
    options = [];

    cols = [];
    data = [];

    events = [];

    sortCols = [];
    filterCols = [];
    filteredRows = [];

    page=1;
    page_size = 10;

    table = null;
    trFilter = null;

    #nextRowId = 0;

    constructor(element, options = {}) {
        let that = this;
        this.table = document.querySelector(element);
        this.table.JSETable = this;

        this.options = {...this.constructor.defaultOptions,...options};

        if(this.options.page_size !== null)
        {
            this.page_size = this.options.page_size;
        }

        this.renderers = this.constructor.globalRenderers;

        if(this.options['renderers'] !== undefined)
        {
            this.options['renderers'].forEach((renderer) => {
                this.renderers[renderer.name] = renderer.renderer;
            });
        }

        if(this.options['filters'] !== undefined)
        {
            this.options['filters'].forEach((filter) => {
                this.filter(filter.col, filter.value, false);
            });
        }

        if(this.options['sort'] !== undefined)
        {

            this.options['sort'].forEach((sort) => {
                this.sortCols.push({"target": sort[0], "ord": (sort[1] == "desc" ? -1 : 1)});
            });
        }

        this.#makeHTML();

        this.#getThead();

        this.table.querySelectorAll('thead tr:last-child th').forEach(t => {
            t.classList.add(this.options.classThSorters);
            t.addEventListener('click',  function (event){
                that.sort(event)
            }, false);
        });

        if(options.lignes !== undefined)
        {
            this.loadData(options.lignes);
        }
        else
        {
            this.#getTbody();
        }


        if(this.options.filterEnable == true)
        {
            this.#makeFilterHead();
        }

        this.#loadSession();

        this.tbody = this.table.querySelector('tbody');

        this.trigger('onAfterSetData');
        this.initialisationDone = true;
        this.render();
    };

    static setDefaultOption(optionName, optionValue)
    {
        this.defaultOptions[optionName] = optionValue;
    }

    static addGlobalRenderer(type, renderer)
    {
        if (typeof renderer === 'function')
        {
            this.globalRenderers[type] = {"display" : renderer,};
        }
        else if (typeof renderer === 'object')
        {
            this.globalRenderers[type] = renderer;
        }
    }

    addRenderer(type, renderer)
    {
        if (typeof renderer === 'function')
        {
            this.renderers[type] = {"display" : renderer,};
        }
        else if (typeof renderer === 'object')
        {
            this.renderers[type] = renderer;
        }

        this.createSelect();
        this.render();
    }

    #getThead()
    {
        this.cols = [];
        this.table.querySelectorAll('thead tr:last-child th').forEach((col,k) => {
            this.cols[k] = {
                "name": col.dataset.key || "col_"+k ,
                "num": k,
                "type": col.dataset.type,
                "filter": col.dataset.filter,
                "multiple_separator": col.dataset.multipleseparator,
                "strict_filter": col.dataset.strict_filter,
                "thElement": col,
            };
            if(this.cols[k].filter == "select")
            {
                this.cols[k].strict_filter = 1;
            }
        });
    }

    #getTbody()
    {
        this.data = [];

        this.table.querySelectorAll('tbody tr').forEach((tr,k) => {
            let ligne = new Object();

            tr.querySelectorAll('td').forEach((td,j) => {
                if(this.cols[j].multiple_separator == undefined)
				{
					ligne[this.cols[j].name] = td.innerHTML;
				}
				else
				{
					ligne[this.cols[j].name] = td.innerHTML.split(this.cols[j].multiple_separator);
				}

                if(td.dataset.addvalue !== undefined)
                {
                    Object.entries(JSON.parse(td.dataset.addvalue)).forEach(([key, val]) => {
                        ligne[key] = val;
                    });

                }
            });
            this.addLine(ligne);
        });
    }

    #makeFilterHead()
    {
        let that = this;

        if(this.trFilter == null)
        {
            this.trFilter = document.createElement("tr");
            this.trFilter.classList.add(this.options.classRowFilters);
        }
        else
        {
            this.trFilter.innerHTML = '';
        }

        this.cols.forEach((c,k) => {
            let th = document.createElement("th");
            let filter_element = null;

            if(c.filter == "select")
            {
                filter_element = document.createElement("select");
                this.addEventListner('onAfterSetData', 'createSelect', () => this.createSelect(), 40);
                if(this.options.filterMultiple == true)
                {
                    filter_element.setAttribute('id', 'JSESelect_'+k);
                    filter_element.setAttribute('multiple', 'multiple');

                    filter_element.getValue = ()=>{
                        if(filter_element.multiplejs !== undefined)
                        {
                            return filter_element.multiplejs.getResult();
                        }
                        return filter_element.value;
                    };

                    filter_element.setValue = (val)=>
                    {
                        if(val == '')
                        {
                            val = [];
                        }

                        if(filter_element.multiplejs !== undefined)
                        {

                            filter_element.multiplejs.setValue(val);
                            return;
                        }
                        filter_element.value = val;
                    };
                }
            }
            else
            {
                filter_element = document.createElement("input");
                filter_element.ondblclick = function() {
                    this.value = "<<vide>>";
                    this.dispatchEvent(new Event("input"));
                };
                filter_element.oninput = function() {
                    this.dispatchEvent(new Event("change"));
                };
            }

            if(filter_element.getValue === undefined)
            {
                filter_element.getValue = ()=>{
                    return filter_element.value;
                };
            }

            if(filter_element.setValue === undefined)
            {
                filter_element.setValue = (val)=>{
                    filter_element.value = val;
                };
            }

            this.cols[k].filterElement = filter_element;

            if(this.filterCols[k] != null)
            {
                filter_element.setValue(this.filterCols[k].value);
            }

            filter_element.addEventListener('change', function() {
                that.filter(k, this.getValue());
            }, false);

            if(filter_element !== null)
            {
                th.append(filter_element);
            }

            this.trFilter.append(th);
        });


        this.table.querySelector('thead').append(this.trFilter);
    }

    #getColNameByNum(name)
    {
        var found = this.cols.find(e => e.name === name);
        return found;
    }

    render()
    {
        if(this.initialisationDone == false)
        {
            return;
        }
        this.#filterLines();
        this.#sortLines();
        this.trigger('onPageChange');

        let tbody = this.table.querySelector('tbody');
        tbody.innerHTML = '';
        let body = '';

        let page_size = this.page_size;

        if(this.page_size == -1)
        {
            this.page = 1;
            page_size = this.filteredRows.length;
        }

        this.#saveSession();

        if(this.filteredRows.length>0)
        {
            for(var keyRow = (this.page - 1) * page_size; keyRow < Math.min(this.page* page_size,this.filteredRows.length ); keyRow++)
            {
                let row = this.data['key_'+this.filteredRows[keyRow]];

                let rowHTML = '';
                rowHTML += '<tr data-rowkey="' + row.key + '">';

                this.cols.forEach((col,keyCol) => {
                    rowHTML += '<td>' + this.#printval(row.values[col.name], "display", col.multiple_separator) + '</td>';
                });

                rowHTML += '</tr>'
                body += rowHTML;
            }
        }

        tbody.innerHTML += body;
        if(this.options.DivText)
        {
            document.querySelector("." + this.options.classDivText).innerHTML = this.options.divTextFormat.replace('{start}',(this.page-1)*this.page_size+1).replace('{end}',Math.min(this.page*this.page_size, this.filteredRows.length)).replace('{filtered}',this.filteredRows.length).replace('{total}',this.data.length);
        }
    }

    #sortLines()
    {
        if(this.options.sorterEnable == true)
        {
            this.filteredRows.sort((a, b) => {
                for(var i = 0; i < this.sortCols.length; i++)
                {
                    let val_a = this.#printval(this.data['key_' + a].values[this.cols[this.sortCols[i].target].name], "sort");
                    let val_b = this.#printval(this.data['key_' + b].values[this.cols[this.sortCols[i].target].name], "sort");

                    if(val_a > val_b)
                    {
                        return this.sortCols[i].ord;
                    }
                    else if(val_a < val_b)
                    {
                        return 0 - this.sortCols[i].ord;
                    }
                }
                return 0;
            });

            this.#setClassSorter();

        }
    }

    #setClassSorter()
    {
        this.table.querySelectorAll('.sort_asc.'+this.options.classThSorters).forEach(th => {
            th.classList.remove('sort_asc');
        });

        this.table.querySelectorAll('.sort_desc.'+this.options.classThSorters).forEach(th => {
            th.classList.remove('sort_desc');
        });

        for(var i = 0; i < this.sortCols.length; i++)
        {
            let col = this.cols[this.sortCols[i].target];

            if(this.sortCols[i].ord == 1)
            {
                col.thElement.classList.add('sort_asc');
            }
            else if(this.sortCols[i].ord == -1)
            {
                col.thElement.classList.add('sort_desc');
            }
        }


    }


    #filterLines()
    {
        console.log('filter');
        if(this.options.filterEnable == true)
        {
            this.filteredRows = [];
            Object.values(this.data).forEach((line,keyRow) =>
            {
                line.filter =0;

                if(this.options.filterEnable && this.filterCols.length > 0)
                {
                    this.filterCols.forEach((filter,key) => {
						if(filter != null)
						{
                            let colFilter = 1;

                            if(this.#evalfilter(line.values[this.cols[key].name],filter.value, this.cols[key].strict_filter) == true)
                            {
                                colFilter =0;
                            }

                            if(colFilter != 0)
                            {
                                line.filter =1;
                            }
						}
                    });
                }

                if(line.filter == 0)
                {
                    this.filteredRows.push(line.key);
                }
            });
        }
        else
        {
            this.filteredRows = Object.values(this.data).map(item => item['key']);
        }
    }

    #evalfilter(val, filter, strict)
    {
        if(Array.isArray(val))
        {
            let isGood = false;
            val.forEach(v => {
                isGood |= this.#evalfilter(v, filter, strict);
            })
            return isGood;
        }

        let value = val.filter;

        if(value == "")
        {
            value = "<<vide>>";
        }

        if(Array.isArray(filter))
        {
            return filter.indexOf(value) != -1;
        }
        else
        {
            if(strict == 1)
            {
                //--TODO:add operation and content
                return value == filter
            }
            else
            {
                return value.toString().toLowerCase().includes(filter.toLowerCase())
            }
        }
    }

    sort(e)
    {
        let target = e.target.cellIndex;
        var found = false;

        for(var i = 0; i < this.sortCols.length; i++)
        {
            if (this.sortCols[i].target == target && (this.sortCols.length <= 1 || e.shiftKey == true))
            {
                this.sortCols[i].ord = 0-this.sortCols[i].ord;
                //this.#setClassSorter(e.target, this.sortCols[i].ord);
                found = true;
                break;
            }
        }

        if(found == false)
        {
            if(e.shiftKey == false)
            {
                this.sortCols = [];
               // this.#clearClassSorter();
            }

            this.sortCols.push({"target": target, "ord": 1});
           // this.#setClassSorter(e.target, 1);
        }

        this.render();
    }

    filter(colNum, filter, render=true)
    {
        if(filter == "")
        {
            delete this.filterCols[colNum];
        }
        else
        {
            if(this.filterCols[colNum] === undefined || this.filterCols[colNum] == null)
            {
                this.filterCols[colNum] = {"value" : filter};
            }
            else
            {
                this.filterCols[colNum].value = filter;
            }
        }
        if(render)
        {
            this.render();
        }
    }

    fillFilters(colNum = null)
    {
        if(colNum != null)
        {
            if(this.cols[colNum] !== undefined && this.cols[colNum].filterElement !== undefined)
            {
                if(this.filterCols[colNum] === undefined || this.filterCols[colNum] == null)
                {
                    this.cols[colNum].filterElement.setValue('');
                }
                else
                {
                    this.cols[colNum].filterElement.setValue(this.filterCols[colNum].value);
                }
            }
        }
        else
        {
            if(this.options.filterEnable && this.filterCols.length > 0)
            {
                this.filterCols.forEach((filter,key) => {
                    this.fillFilters(key);
                });
            }
        }
    }

    addLine(line)
    {
        this.data['key_' + this.#nextRowId] = ({'filter': 0, 'data': line,'values': [], 'key' : this.#nextRowId});
        this.updateLineValues(this.#nextRowId);
        this.#nextRowId++
    }

    removeLine(numLine)
    {
        delete this.data['key_'+numLine];
        this.render();
    }

    updateLine(numLine, data)
    {
        Object.entries(data).forEach(([colName, value]) => {
            this.data['key_' + numLine].data[colName] = value;
        });
        this.updateLineValues(numLine);
    }

    setValue(numLine, colName, value)
    {
        this.data['key_' + numLine].data[colName] = value;
        this.updateLineValues(numLine);
    }

    updateLineValues(numLine)
    {
        Object.entries(this.data['key_' + numLine].data).forEach(([colName, value]) => {
            let col = this.cols.find(e => e.name == colName);
            this.data['key_'+numLine].values[colName] = Array.isArray(value) ? value.map(a => this.#getAllValues(col, a, this.data['key_' + numLine].data)): this.#getAllValues(col, value, this.data['key_' + numLine].data);
        });
    }

    #getAllValues(col, value, object)
    {
        return {
            "display" : this.#getTypedValues(col, value, object, "display"),
            "filter" : this.#getTypedValues(col, value, object, "filter"),
            "sort" : this.#getTypedValues(col, value, object, "sort"),
        };
    }
    #getTypedValues(col, value, object, type)
    {
        if(Array.isArray(value))
        {
            return value.map(v => this.#getTypedValues(col, v, object, type));
        }


        if(col === undefined || this.renderers[col.type] === undefined)
        {
            return value;
        }

        if(this.renderers[col.type][type] !== undefined)
        {
            let fct = this.renderers[col.type][type];
            return fct(value, object);
        }

        if(type != "display" && this.renderers[col.type]["display"] !== undefined)
        {
            let fct = this.renderers[col.type]["display"];
            return fct(value, object);
        }

        return value;
    }
    loadData(data)
    {
        let that = this;
        data.forEach(line => {
            that.addLine(line);
        });
        this.trigger('onAfterSetData');
        this.render();
    }

    #printval(value, type, join_separator = false)
    {
        if(Array.isArray(value))
        {
            let ret = value.map(v => this.#printval(v, type, join_separator));

            if(join_separator !== false && Array.isArray(value))
            {
                return ret.join(join_separator);
            }

            return ret;
        }

        return value[type] == undefined ? value['val'] : value[type];
    }

    trigger(eventName)
    {
        if(this.events[eventName] !== undefined)
        {
            Object.values(this.events[eventName]).sort((a, b) => a.priority - b.priority).forEach(ev => {
                this.debug("launch event : " + ev.name);
                ev.callback();
            });
        }
    }

    addEventListner(eventName, listnerName, callback, priority = 50)
    {
        if(this.events[eventName] === undefined)
        {
            this.events[eventName] = {};
        }
        this.events[eventName][listnerName] = {name: listnerName, callback: callback, priority: priority};
    }

    debug(str)
    {
        if (this.options.debug)
        {
            console.log(str);
        }
    }

    createSelect()
    {
        this.cols.forEach((c,k) =>
        {
            if(c.filter == "select")
            {
                let select = this.cols[k].filterElement;
                let innerHtml = '';
                let valvide= false;

				let dataset = {};
                let that = this;

                dataset = [...new Set(
                    Object.values(this.data).map(function (a)
                    {
                        if(c.multiple_separator == undefined)
                        {
                            return {
                                "key" : that.#printval(a.values[that.cols[k].name], "filter"),
                                "val" : that.#printval(a.values[that.cols[k].name], "display")
                            }
                        }
                        else
                        {
                            return a.values[that.cols[k].name].map( b => {
                                return {
                                    "key" : that.#printval(b , "filter", false),
                                    "val" : that.#printval(b , "display", false)
                                }
                            });
                        }
                    }
                        ).flat(2)
                )];

                dataset = [...new Map(dataset.map(item =>
                    [item['val'], item])).values()];


                Object.values(dataset).sort(function(a,b) { return a.val > b.val}).forEach((val,k) => {
                    if(val !== null && val !== "" && val !== " ")
                    {
                        let key = val.key.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g,'&apos');
                        innerHtml += '<option value="'+key+'">'+val.val+'</option>';
                    }
                    else
                    {
                        valvide= true;
                    }
                });

                console.log(dataset);

                if(valvide == true)
                {
                    innerHtml = '<option value="&lt;&lt;vide&gt;&gt;">&lt;&lt;vide&gt;&gt;</option>' + innerHtml;
                }

                if(this.options.filterMultiple != true)
                {
                    innerHtml = '<option value="" selected="selected"></option>' + innerHtml;
                }


                select.innerHTML = innerHtml;

                if(this.options.filterMultiple == true)
                {
                    if(this.cols[k].filterElement.multiplejs !== undefined)
                    {
                        this.cols[k].filterElement.multiplejs.destroy();
                    }

                    this.cols[k].filterElement.multiplejs = new vanillaSelectBox("#" + this.cols[k].filterElement.id, { "maxHeight": 200, "search": true, "placeHolder": "Choisissez..." });
                }

                if(this.filterCols[k] != null)
                {
                    select.setValue(this.filterCols[k].value);
                }
            }
        });
    }

    getNbPages()
    {
        if(this.page_size == -1)
        {
            return 1;
        }
        return Math.ceil(this.filteredRows.length / this.page_size);
    }

    setPageSize(size, render=true)
    {
        this.page_size = size;
        this.trigger('onPageSizeChange');
        this.pageSet(this.page);
        if(render)
        {
            this.render();
        }
    }

    pageSet(page)
    {
        page = Math.max(1,Math.min( page, this.getNbPages()));

        if(this.page != page)
        {
            this.page = page;
            this.trigger('onPageChange');
            this.render();
        }
    }
    pageFirst()
    {
        this.pageSet(1);
    }

    pageDown()
    {
        this.pageSet(this.page - 1);
    }

    pageUp()
    {
        this.pageSet(this.page + 1);
    }

    pageLast()
    {
        this.pageSet(this.getNbPages());
    }

    #makeHTML()
    {
        let divcontainer = document.createElement("div");
        divcontainer.classList.add(this.options.classDivContainer);
        this.table.parentNode.insertBefore(divcontainer,this.table);

        let divtop = document.createElement("div");
        divtop.classList.add(this.options.classDivTop);
        divcontainer.appendChild(divtop);

        if(this.options.DivText)
        {
            let divtext = document.createElement("div");
            divtext.classList.add(this.options.classDivText);
            divcontainer.appendChild(divtext);
        }

        let divtable = document.createElement("div");
        divtable.classList.add(this.options.classDivTable);
        divcontainer.appendChild(divtable);


        let divbottom = document.createElement("div");
        divbottom.classList.add(this.options.classDivBottom);
        divcontainer.appendChild(divbottom);

        divtable.appendChild(this.table);

        if(this.options.pagerEnable)
        {
            let divpager = document.createElement("div");
            divpager.classList.add(this.options.classDivPager);

            if (this.options.pagerDivPosition == 'top') {
                divtop.appendChild(divpager);
            }
            else {
                divbottom.appendChild(divpager);
            }

            let that = this;

            if(this.options.pagerBtnFirstLast == true)
            {
                let btnFirst = document.createElement('input');
                btnFirst.type = 'button';
                btnFirst.value = this.options.pagerBtnFirstVal;
                btnFirst.className = this.options.pagerBtnClass;

                btnFirst.onclick = function() {
                    that.pageFirst();
                };
                divpager.appendChild(btnFirst);
            }

            let btnPrev = document.createElement('input');
            btnPrev.type = 'button';
            btnPrev.value = this.options.pagerBtnPrevVal;
            btnPrev.className = this.options.pagerBtnClass;

            btnPrev.onclick = function() {
                that.pageDown();
            };
            divpager.appendChild(btnPrev);


            if(this.options.pagerSelectPage == true)
            {
                let divpageselect = document.createElement("div");
                divpageselect.classList.add(this.options.classDivPageSelect);
                divpager.appendChild(divpageselect);

                let selectPage = document.createElement('select');
                selectPage.className = this.options.pagerSelectPageClass;
                selectPage.onchange = function() {
                    if(that.page != this.value)
                    {
                        that.pageSet(this.value);
                    }
                };

                this.addEventListner('onPageChange', 'updateSelectPage', function() {
                    selectPage.innerHTML = '';
                    for(let i=1 ; i<= that.getNbPages(); i++)
                    {
                        let option = document.createElement('option');
                        option.value = i;
                        option.text = i;
                        if(that.page == i)
                        {
                            option.selected = "selected";
                        }
                        selectPage.appendChild(option);
                    }
                    if(that.filteredRows.length > 0 && that.page > that.getNbPages())
                    {
                        that.pageSet(1);
                    }
                }, 50);

                divpageselect.appendChild(selectPage);
            }


            let btnNext = document.createElement('input');
            btnNext.type = 'button';
            btnNext.value = this.options.pagerBtnNextVal;
            btnNext.className = this.options.pagerBtnClass;

            btnNext.onclick = function() {
                that.pageUp();
            };
            divpager.appendChild(btnNext);

            if(this.options.pagerBtnFirstLast == true)
            {
                let btnLast = document.createElement('input');
                btnLast.type = 'button';
                btnLast.value = this.options.pagerBtnLastVal;
                btnLast.className = this.options.pagerBtnClass;

                btnLast.onclick = function() {
                    that.pageLast();
                };
                divpager.appendChild(btnLast);
            }

            if(this.options.pagerSelectPageSize == true)
            {
                let divpagesizeselect = document.createElement("div");
                divpagesizeselect.classList.add(this.options.classDivPageSize);

                if (this.options.pageSizeDivPosition == 'top') {
                    divtop.appendChild(divpagesizeselect);
                }
                else {
                    divbottom.appendChild(divpagesizeselect);
                }

                let selectPageSize = document.createElement('select');
                selectPageSize.className = this.options.pagerSelectPageSizeClass;
                selectPageSize.onchange = function() {
                    that.setPageSize(this.value);
                };

                this.options.pagerSelectPageSizeList.forEach((v) =>
                {
                    let option = document.createElement('option');
                    option.value = v;
                    option.text = v == -1 ? this.options.pagerSelectPageSizeAll : v;
                    if(that.page_size == v)
                    {
                        option.selected = "selected";
                    }
                    selectPageSize.appendChild(option);
                });

                divpagesizeselect.appendChild(selectPageSize);

                this.addEventListner('onPageSizeChange', 'updateSelectPageSize', function() {
                    if(selectPageSize.value != that.page_size)
                    {
                        selectPageSize.value = that.page_size;
                    }
                }, 50);

            }
        }

        if(this.options.exportEnable)
        {
            let divexport = document.createElement("div");
            divexport.classList.add(this.options.classDivExport);

            if (this.options.exportDivPosition == 'top') {
                divtop.appendChild(divexport);
            }
            else {
                divbottom.appendChild(divexport);
            }


            let btntest = document.createElement('input');
            btntest.type = 'button';
            btntest.value = 'Export';
            btntest.className = this.options.pagerBtnClass;

            btntest.onclick = function() {
                that.pageUp();
            };
            divexport.appendChild(btntest);
        }
    }

    #saveSession()
    {
        if(this.options.sessionSave == true)
        {
            sessionStorage.setItem('JSETable.'+window.location+'.filters', JSON.stringify(this.filterCols));
            sessionStorage.setItem('JSETable.'+window.location+'.sort', JSON.stringify(this.sortCols));
            sessionStorage.setItem('JSETable.'+window.location+'.pager', JSON.stringify({page: this.page, page_size: this.page_size}));
        }
    }

    #loadSession()
    {
        if(this.options.sessionSave == true)
        {
            if(this.options.filterEnable == true)
            {
                if(sessionStorage.getItem('JSETable.'+window.location+'.filters') != null)
                {
                    this.filterCols = JSON.parse(sessionStorage.getItem('JSETable.'+window.location+'.filters'));
                    this.fillFilters();
                }
            }

            if(this.options.sorterEnable == true)
            {
                if(sessionStorage.getItem('JSETable.'+window.location+'.sort') != null)
                {
                    this.sortCols = JSON.parse(sessionStorage.getItem('JSETable.'+window.location+'.sort'));
                }
            }

            if(this.options.pagerEnable == true)
            {
                let pagersession = JSON.parse(sessionStorage.getItem('JSETable.'+window.location+'.pager'));
                if(pagersession != null)
                {
                    this.setPageSize(pagersession.page_size);
                    this.page = pagersession.page;
                }
            }
        }
    }
}

/*
"filterEnable": true,
				"sorterEnable": true,
				"pagerEnable": true,

					sortCols = [];
	filterCols = [];

	*/
