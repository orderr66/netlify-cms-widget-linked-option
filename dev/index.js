import './bootstrap.js'
import CMS, { init } from 'netlify-cms'
import 'netlify-cms/dist/cms.css'
import Preview from '../src/Preview'
import RelationControl from '../src/Control'


const config = {
  backend: {
    name: 'test-repo',
    login: false,
  },
  media_folder: 'assets',
  collections: [{
    name: 'test',
    label: 'Test',
    files: [{
      file: 'test.yml',
      name: 'test',
      label: 'Test',
      fields: [
        {label: "Series",
        name: "title",
        widget: 'test',
        collection: "series",
        searchFields: ["title"],
        valueField: "title"},
      ],
    }],
  },
  {
    name: 'series',
    label: 'Series',
    folder: 'content/series',
    create: true,
    slug: '{{year}}-{{month}}-{{day}}-{{slug}}',
    identifier_field: 'slug',
    fields: [
      { name: 'title', label: 'Test Widget', widget: 'string'},
    ],
  }
],
}

CMS.registerWidget('test', RelationControl, Preview)

init({ config })
