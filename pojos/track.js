class Track {

  constructor(data) {
    this.title = data.message.body.track_list[0].track.track_name;
    this.artistName = data.message.body.track_list[0].track.artist_name;
    this.rating = data.message.body.track_list[0].track.track_rating;
    this.genre = this.getGenre(data.message.body.track_list[0].track.primary_genres.music_genre_list);
  }

  getGenre(data) {
    if (data[0]) {
      return data[0].music_genre.music_genre_name;
    } else {
      return 'Unknown';  
    }
  }

}

module.exports = Track;