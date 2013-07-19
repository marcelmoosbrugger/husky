Husky.DEBUG = true;

describe("Husky.UI.DataGrid", function() {
    var $dataGridContainer, server;

    beforeEach(function() {
        $dataGridContainer = $('<div id="js-data-grid"/>');
        $('body').append($dataGridContainer);

        server = sinon.fakeServer.create();

        server.respondWith('GET', '/contacts?pageSize=4', [200, { 'Content-Type': 'application/json' },
            '{"pageSize": "4", "page": "1", "total": 56, "head": [{ "content": "Head 1", "width": "100" }, { "content": "Head 2" }, { "content": "Head 3" }], "rows": [{ "id": "1", "columns": [{ "content": "Hallo 1" }, { "content": "Hallo 2" }, { "content": "Hallo 3" }] }, { "id": "2", "columns": [{ "content": "Hallo 1" }, { "content": "Hallo 2" }, { "content": "Hallo 3" }] }, { "id": "3", "columns": [{ "content": "Hallo 1" }, { "content": "Hallo 2" }, { "content": "Hallo 3" }] }, { "id": "4", "columns": [{ "content": "Hallo 1" }, { "content": "Hallo 2" }, { "content": "Hallo 3" }] }] }'
        ]);

        server.respondWith('GET', '/contacts?pageSize=4&page=2', [200, { 'Content-Type': 'application/json' },
            '{"pageSize": "4", "page": "2", "total": 56, "head": [{ "content": "Head 1", "width": "100" }, { "content": "Head 2" }, { "content": "Head 3" }], "rows": [{ "id": "1", "columns": [{ "content": "Tschau" }, { "content": "Hallo 2" }, { "content": "Hallo 3" }] }, { "id": "2", "columns": [{ "content": "Hallo 1" }, { "content": "Hallo 2" }, { "content": "Hallo 3" }] }, { "id": "3", "columns": [{ "content": "Hallo 1" }, { "content": "Hallo 2" }, { "content": "Hallo 3" }] }, { "id": "4", "columns": [{ "content": "Hallo 1" }, { "content": "Hallo 2" }, { "content": "Hallo 3" }] }] }'
        ]);

    });

    afterEach(function() {
        server.restore();
    });

    it("Create instance", function() {

        try {
            var $dataGrid = $('#js-data-grid').huskyDataGrid({
                url: '/contacts',
                pagination: true,
                showPages: 6,
                pageSize: 4,
                selectItems: true
            });

            server.respond();

        } catch (e) {
            // TODO fail('DataGrid instantiation');
        }

        expect(typeof $dataGrid.data('Husky.Ui.DataGrid')).toEqual('object')
        expect($dataGrid.data('Husky.Ui.DataGrid').data.total).toEqual(56);
    });
});