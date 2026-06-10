const {
Client,
GatewayIntentBits,
PermissionsBitField,
ChannelType,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require("discord.js");

const config = require("./config.json");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.once("clientReady", async () => {
console.log(`${client.user.tag} está online!`);

const canalPainel = client.channels.cache.get(config.canalPainel);

if (!canalPainel) {
    console.log("Canal do painel não encontrado!");
    return;
}

const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId("criar_ticket")
        .setLabel("🎫 Abrir Ticket")
        .setStyle(ButtonStyle.Primary)
);

await canalPainel.send({
    embeds: [{
        title: "🎫 Sistema de Tickets",
        description: "Clique no botão abaixo para abrir um ticket.",
        color: 0x5865F2
    }],
    components: [row]
});

});

client.on("interactionCreate", async interaction => {

if (!interaction.isButton()) return;

if (interaction.customId === "criar_ticket") {

    const ticketExistente = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.id}`
    );

    if (ticketExistente) {
        return interaction.reply({
            content: `Você já possui um ticket: ${ticketExistente}`,
            ephemeral: true
        });
    }

    const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: config.categoriaTickets,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages
                ]
            },
            {
                id: config.cargoStaff,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages
                ]
            }
        ]
    });

    const fecharRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("fechar_ticket")
            .setLabel("🔒 Fechar Ticket")
            .setStyle(ButtonStyle.Danger)
    );

    await canal.send({
        content: `${interaction.user}, bem-vindo ao suporte!`,
        components: [fecharRow]
    });

    await interaction.reply({
        content: `Seu ticket foi criado: ${canal}`,
        ephemeral: true
    });

    const canalLogs = interaction.guild.channels.cache.get(config.canalLogs);

    if (canalLogs) {
        canalLogs.send({
            embeds: [{
                title: "🎫 Ticket Aberto",
                description: `Usuário: ${interaction.user}\nCanal: ${canal}`,
                color: 0x00ff00,
                timestamp: new Date()
            }]
        });
    }
}

if (interaction.customId === "fechar_ticket") {

    const canalLogs = interaction.guild.channels.cache.get(config.canalLogs);

    if (canalLogs) {
        canalLogs.send({
            embeds: [{
                title: "🔒 Ticket Fechado",
                description: `Fechado por: ${interaction.user}\nCanal: ${interaction.channel.name}`,
                color: 0xff0000,
                timestamp: new Date()
            }]
        });
    }

    await interaction.reply({
        content: "🔒 Fechando ticket em 5 segundos..."
    });

    setTimeout(async () => {
        await interaction.channel.delete().catch(() => {});
    }, 5000);
}

});

client.login(process.env.TOKEN);