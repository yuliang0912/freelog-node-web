'use strict'

const commonRegex = require('egg-freelog-base/app/extend/helper/common_regex')

/**
 * node 主域名检查中间件
 */
module.exports = (option, app) => async function (ctx, next) {

    try {

        if (ctx.request.url.toLowerCase().startsWith('/home/triggerUpdateNodeTemplateEvent'.toLowerCase())) {
            return await
                next()
        }

        var isTestNode = false
        var nodeDomain = ctx.host.replace(/(\.freelog\.com|\.testfreelog\.com)/i, '')

        if (nodeDomain.startsWith('t.')) {
            isTestNode = true
            nodeDomain = nodeDomain.replace('t.', '')
        }

        if (!commonRegex.nodeDomain.test(nodeDomain)) {
            ctx.body = `<h1>sorry,${nodeDomain} is not freelog website</h1>`
            return
        }
        ctx.request.identityInfo = ctx.request.identityInfo || {}
        const nodeInfo = await ctx.curlIntranetApi(`${ctx.webApi.nodeInfo}/detail?nodeDomain=${nodeDomain}`)
        if (!nodeInfo) {
            ctx.body = `<h1>sorry,${nodeDomain} is not freelog website</h1>`
            return
        }
        if (nodeInfo.status === 2) {
            ctx.body = `<h1>sorry,${nodeDomain} is not freelog website</h1>`
            return
        }
        if (isTestNode) {
            const testNodeRuleInfo = await
                ctx.curlIntranetApi(`${ctx.webApi.testNode}/${nodeInfo.nodeId}`)
            nodeInfo.pageBuildId = testNodeRuleInfo ? testNodeRuleInfo.themeId : ""
        }
        if (!nodeInfo.pageBuildId) {
            ctx.body = `<h1>${isTestNode ? '测试节点' : '节点'}还未初始化</h1>`
            return
        }

        ctx.request.nodeInfo = nodeInfo
        ctx.request.isTestNode = isTestNode

        ctx.generateNodeJwtInfo(nodeInfo)

        await next()
    } catch (e) {
        ctx.body = `<h2>出错啦~,error:${e.message}</h2><div hidden="hidden">${e.stack}</div>`
    }
}