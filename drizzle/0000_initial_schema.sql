CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text NOT NULL,
	`icon` text DEFAULT '📁' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `folders_user_id_idx` ON `folders` (`user_id`);--> statement-breakpoint
CREATE INDEX `folders_workspace_id_idx` ON `folders` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`user_agent` text,
	`ip_address` text,
	`revoked_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `snippet_tags` (
	`snippet_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`snippet_id`, `tag_id`),
	FOREIGN KEY (`snippet_id`) REFERENCES `snippets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `snippet_tags_tag_id_idx` ON `snippet_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `snippets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text,
	`folder_id` text,
	`title` text NOT NULL,
	`icon` text DEFAULT '📝' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`language` text DEFAULT 'plain' NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_opened_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `snippets_user_id_idx` ON `snippets` (`user_id`);--> statement-breakpoint
CREATE INDEX `snippets_workspace_id_idx` ON `snippets` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `snippets_folder_id_idx` ON `snippets` (`folder_id`);--> statement-breakpoint
CREATE INDEX `snippets_favorite_idx` ON `snippets` (`favorite`);--> statement-breakpoint
CREATE INDEX `snippets_title_idx` ON `snippets` (`title`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_user_name_unique` ON `tags` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `tags_user_id_idx` ON `tags` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`icon` text DEFAULT '🗂️' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workspaces_user_id_idx` ON `workspaces` (`user_id`);--> statement-breakpoint
CREATE INDEX `workspaces_title_idx` ON `workspaces` (`title`);