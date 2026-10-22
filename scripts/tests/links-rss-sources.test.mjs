import{test}from'node:test';import assert from'node:assert/strict';import{parseFirstGroupRssLinks}from'../lib/links-rss-sources.mjs';
test('structured YAML survives field reordering and only selects first group',()=>{const yaml=`linkGroups:
  - desc: 中文：描述
    links:
      - name: 站长
        rss: https://example.com/feed.xml
        url: https://example.com
        blog: "博客: 名称"
    name: 第一组
  - name: 第二组
    links:
      - url: https://second.example
        rss: https://second.example/rss
`;const sources=parseFirstGroupRssLinks(yaml);assert.equal(sources.length,1);assert.equal(sources[0].name,'站长');assert.equal(sources[0].blog,'博客: 名称');});
test('empty first group does not fall through; invalid YAML fails instead of overwriting cache',()=>{assert.deepEqual(parseFirstGroupRssLinks('linkGroups: []'),[]);assert.deepEqual(parseFirstGroupRssLinks('linkGroups: [{name: 空, links: []}, {name: 二, links: [{rss: https://second.example/rss}]}]'),[]);assert.throws(()=>parseFirstGroupRssLinks('linkGroups: [broken'));assert.throws(()=>parseFirstGroupRssLinks('linkGroups: {}'));assert.deepEqual(parseFirstGroupRssLinks('linkGroups: [{name: 一, links: [{rss: "javascript:bad"}, {rss: ""}]}]'),[]);});
