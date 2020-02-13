"use strict";

var CONTAINERS_URL = "/api/containers/";
module.exports = function(Project) {

	
	Project.uploadProject = function(ctx, options, cb) {
		Project.app.models.container.upload(
			ctx.req,
			ctx.result,
			{
				maxFileSize: 10 * 1024 * 1024,
				container: 'jdiazs',
				allowedContentTypes: ['image/png', 'image/jpeg', 'image/jpg']
  			},
			function(err, projectObj) {
				if (err) cb(err);
				else {
					var projectInfo = projectObj.files[''][0];
					Project.create(
						{
							name: projectInfo.name.split(".")[0],
							url:
								CONTAINERS_URL +
								projectInfo.container +
								"/download/" +
								projectInfo.name
						},
						function(err, obj) {
							if (err) {
								cb(err);
							} else {
								cb(null, obj);
							}
						}
					);
				}
			}
		);
	};

	Project.remoteMethod("uploadProject", {
		description: "Uploads a Project",
		accepts: [
			{ arg: "ctx", type: "object", http: { source: "context" } },
			{ arg: "options", type: "object", http: { source: "query" } }
		],
		returns: {
			arg: "projectObject",
			type: "object",
			root: true
		},
		http: { verb: "post" }
	});
};
