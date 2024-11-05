function handleApiKeyError(error, interaction) {
    if (error.response && error.response.status === 401) {
      return interaction.editReply({ content: 'Invalid API key. Please check your key and try again.' });
    } else if (error.message.includes('scope')) { 
      return interaction.editReply({ content: error.message });
    } else {
      return interaction.editReply({ content: 'An error occurred while setting your API key. Please try again later.' });
    }
  }
  
  module.exports = { handleApiKeyError };