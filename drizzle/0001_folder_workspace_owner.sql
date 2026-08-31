PRAGMA foreign_keys = OFF;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `workspaces_user_id_id_unique` ON `workspaces` (`user_id`, `id`);
--> statement-breakpoint
CREATE TABLE `folders_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text NOT NULL,
	`icon` text DEFAULT '📁' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`, `workspace_id`) REFERENCES `workspaces`(`user_id`, `id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `folders_new` (`id`, `user_id`, `workspace_id`, `title`, `icon`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, `workspace_id`, `title`, `icon`, `created_at`, `updated_at`
FROM `folders`;
--> statement-breakpoint
DROP TABLE `folders`;
--> statement-breakpoint
ALTER TABLE `folders_new` RENAME TO `folders`;
--> statement-breakpoint
CREATE INDEX `folders_user_id_idx` ON `folders` (`user_id`);
--> statement-breakpoint
CREATE INDEX `folders_workspace_id_idx` ON `folders` (`workspace_id`);
--> statement-breakpoint
PRAGMA foreign_keys = ON;
