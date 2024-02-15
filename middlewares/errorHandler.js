module.exports = {
    errorHandler: function (err, req, res, next) {
       
        res.locals.message = err.message
        res.locals.error = req.app.get('env') === 'development' ? err : {}
        console.log(err)

      
        const errStatus = err.status || 500
        const errMessage = err.message
        res.render('error', { errStatus, errMessage })
    },

    err404handle: function (req, res, next) {
        console.log('hello error')
        if (req.session.admin) {
            res.status(404).render('error/404Admin', { err404Msg: 'The page you are looking for not available!' })
        }
        else {
            res.status(404).render('error/404', { err404Msg: 'The page you are looking for not available!' })
        }

    },



}
