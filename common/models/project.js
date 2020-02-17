"use strict";

const port = process.env.LOOPBACK_PORT
const host = process.env.LOOPBACK_HOST
const CONTAINERS_URL = `${host}:${port}/api/containers/`;
const BUCKET = "jdiazs";

module.exports = function(Project) {
	/*
	 *	Hook for set de current date on the creation of a project
	 */
	Project.observe('before save', async function(ctx) {
		ctx.instance.created_at = new Date();
		return;
	});

	/*
	 *	Hook for delete the container file before delete the project obj.with his metadata.
	 */
	Project.observe("before delete", async function(ctx, cb) {
		Project.find(
			{
				where: {
					project_id: ctx.where.project_id
				}
			},
			function(err, projects) {
				projects.forEach(function(project) {
					var file = project.url.split("/");
					file = file[file.length - 1];
					Project.app.models.container.removeFile(BUCKET, file);
				});
			}
		);
		return;
	});

	/*
	 *	Remote method for retrieve the last two uploaded projects
	 */
	Project.recentProjects = function(cb) {
		Project.find(
			{
				order: 'created_at DESC',
				limit: 2
			},
			function(err, projects) {
				if (err) cb(err);
	    		else {
	    			cb(null, projects);
	    		}
			}
		)
	}

	/*
	 *	Remote method for upload a file > container model, and with a trigger define a project with the name of the file.
	 */
	Project.uploadProject = function(ctx, options, cb) {
		Project.app.models.container.upload(
			ctx.req,
			ctx.result,
			{
				maxFileSize: 10 * 1024 * 1024,
				container: BUCKET,
				allowedContentTypes: ["image/png", "image/jpeg", "image/jpg"]
			},
			function(err, projectObj) {
				if (err) cb(err);
				else {
					var projectInfo = projectObj.files[""][0];
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

	Project.remoteMethod("recentProjects", {
		description: "Retrieve the last two projects",
		returns: {
			type: "array",
			root: true
		},
		http: { verb: "get" }
	})

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
