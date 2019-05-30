module.exports = {
//Replace undefined with a URL pointing to the ressource folder / api endpoint to override the default parameter. For example cmdr: "http://"
	api: {
		cmdr: undefined,
		friends: undefined,
		logs: undefined
	},
	default: (typeof window !== "undefined" )?(window.location.href).split("?")[0]:undefined
};