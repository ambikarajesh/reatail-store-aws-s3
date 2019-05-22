exports.error404 = (req,res, next)=>{
    res.status(404).render('errors/404',{
        pageTitle: 'Page Not Found',
        path: ''
    })
}

exports.error500 = (req,res, next)=>{
    res.status(500).render('errors/500',{
        pageTitle: 'Some Error',
        path: '/500'
    })
}